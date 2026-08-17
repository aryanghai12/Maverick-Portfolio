'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildEdges, buildHall } from './hall';
import { damp, measureStations, progressFor, type StationTable } from '@/lib/stations';

/**
 * The camera stations, one per data-cam section.
 *
 * The camera does one thing — travel forward down the corridor — and the
 * sections change how far in it is and how it is angled. Small moves: the hall
 * should feel like a place the visitor is walking through, not a camera doing
 * tricks around them.
 */
const STATIONS: { z: number; y: number; lookY: number; fov: number }[] = [
  { z: 26, y: 0.4, lookY: 0, fov: 54 }, // 00 hero — at the mouth, hall at rest
  { z: 6, y: 1.1, lookY: -0.4, fov: 52 }, // 01 readme — moving in
  { z: -26, y: 0.2, lookY: 0.2, fov: 50 }, // 02 work — among the call graph
  { z: -58, y: -0.6, lookY: 0.5, fov: 50 }, // 03 dependencies
  { z: -92, y: 0.8, lookY: -0.2, fov: 52 }, // 04 upstream
  { z: -128, y: 0.2, lookY: 0, fov: 56 }, // 05 connect — the corridor opens out
];

const COUNT_DESKTOP = 5200;
const COUNT_MOBILE = 1900;

export function Scene({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();

  const mobile = size.width < 820;
  const hall = useMemo(
    () =>
      buildHall({
        count: mobile ? COUNT_MOBILE : COUNT_DESKTOP,
        nearZ: 34,
        farZ: 168,
      }),
    [mobile],
  );
  const edges = useMemo(() => buildEdges(hall, mobile ? 34 : 86), [hall, mobile]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Group>(null);
  const readHead = useRef<THREE.PointLight>(null);

  /* Instance matrices are written exactly once. The hall is a fixed place; the
     camera is what moves. Morphing five thousand bars every frame would cost
     milliseconds and would read as a particle demo rather than architecture. */
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < hall.count; i++) {
      pos.set(hall.positions[i * 3], hall.positions[i * 3 + 1], hall.positions[i * 3 + 2]);
      scale.set(hall.lengths[i], 1, 1);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;

    mesh.geometry.setAttribute(
      'aColor',
      new THREE.InstancedBufferAttribute(hall.colors, 3),
    );
    mesh.computeBoundingSphere();
  }, [hall]);

  /* Station table, remeasured on resize because section heights are fluid. */
  const table = useRef<StationTable>({ anchors: [0], count: 1 });
  useEffect(() => {
    const remeasure = () => {
      table.current = measureStations();
    };
    remeasure();
    // Sections settle after fonts land and reveals run; one late pass catches it.
    const t = setTimeout(remeasure, 1200);
    window.addEventListener('resize', remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', remeasure);
      ro.disconnect();
      cancelAnimationFrame(0);
    };
  }, []);

  const rig = useRef({
    prog: 0,
    smooth: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    /* Hero entrance. Runs 0 → 1 once and pulls the camera forward out of the
       fog while the name resolves. Any scroll input completes it immediately:
       an intro the visitor cannot skip is an intro that gets sat through once
       and resented, and the brief bans them outright. */
    intro: reduced ? 1 : 0,
    /* Frame-time governor state, in the spirit of Kage's: measure what the
       device actually delivers rather than guessing from screen width. */
    acc: 0,
    n: 0,
    scale: 1,
    locked: false,
  });

  useEffect(() => {
    if (reduced) return;
    const skip = () => {
      // Not a jump to 1 — that would snap the camera. Fast-forward instead.
      rig.current.intro = Math.max(rig.current.intro, 0.72);
    };
    window.addEventListener('wheel', skip, { passive: true, once: true });
    window.addEventListener('touchstart', skip, { passive: true, once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchstart', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      rig.current.tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      rig.current.tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    // Animation never jumps on a stalled frame, but the governor below reads
    // the real elapsed time rather than the clamped one.
    const dt = Math.min(delta, 0.05);
    const r = rig.current;

    /* Adaptive resolution. If the device cannot hold the frame, drop pixels
       before dropping frames — a soft background at 60fps beats a sharp one at
       28. It ratchets back up when there is headroom again. */
    if (!r.locked && state.clock.elapsedTime > 2) {
      r.acc += delta;
      r.n++;
      if (r.n >= 45) {
        const avg = r.acc / r.n;
        r.acc = 0;
        r.n = 0;
        if (avg > 0.023 && r.scale > 0.6) {
          r.scale = Math.max(0.6, r.scale * (avg > 0.05 ? 0.7 : 0.87));
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.6) * r.scale);
        } else if (avg < 0.0139 && r.scale < 1) {
          r.scale = Math.min(1, r.scale + 0.08);
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.6) * r.scale);
        }
      }
    }

    if (r.intro < 1) r.intro = Math.min(1, r.intro + dt / 1.9);

    r.prog = progressFor(window.scrollY, table.current);
    // Reduced motion still tracks scroll — the visitor asked for less motion,
    // not for a frozen backdrop that ignores where they are on the page.
    r.smooth = reduced ? r.prog : damp(r.smooth, r.prog, 4.2, dt);
    r.mx = reduced ? 0 : damp(r.mx, r.tmx, 2.4, dt);
    r.my = reduced ? 0 : damp(r.my, r.tmy, 2.4, dt);

    const i = Math.min(STATIONS.length - 1, Math.max(0, Math.floor(r.smooth)));
    const j = Math.min(STATIONS.length - 1, i + 1);
    const f = r.smooth - i;
    const a = STATIONS[i];
    const b = STATIONS[j];

    const z = a.z + (b.z - a.z) * f;
    const y = a.y + (b.y - a.y) * f;
    const lookY = a.lookY + (b.lookY - a.lookY) * f;
    const fov = a.fov + (b.fov - a.fov) * f;

    /* The entrance holds the camera back in the fog and eases it forward. Cubic
       ease-out, so it decelerates into place rather than arriving at speed. */
    const introEase = 1 - Math.pow(1 - r.intro, 3);
    const introZ = (1 - introEase) * 22;

    // Parallax is small on purpose. Enough to feel like a held camera; not
    // enough to swing the hall around when someone moves the mouse to a link.
    camera.position.set(r.mx * 1.5, y + r.my * -0.6, z + introZ);
    target.set(r.mx * 0.7, lookY, z - 24);
    camera.lookAt(target);

    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    /* The read head. A point light travelling just ahead of the camera, so file
       blocks warm as it reaches them and fall dark again behind. This light is
       the whole concept in one object: it is the reviewer moving through the
       code. Everything else is set dressing. */
    if (readHead.current) {
      readHead.current.position.set(r.mx * 1.5, y + 0.6, z - 9);
    }

    /* Call-graph edges belong to the work section. They fade in as the camera
       approaches station 2 and out again afterwards, rather than being on the
       whole time, so they read as a thing that section does. */
    if (edgeRef.current) {
      const d = Math.abs(r.smooth - 2);
      const wanted = Math.max(0, 1 - d * 0.85) * 0.5;
      const mat = edgeRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = reduced ? wanted : damp(mat.opacity, wanted, 5, dt);
      edgeRef.current.visible = mat.opacity > 0.005;
    }

    /* Upstream: concentric rings the camera passes through, one per external
       repository. Commit history read the way you read a tree — and the count
       is not decorative, it is the six repos in the section beside it. */
    if (ringsRef.current) {
      const wanted = Math.max(0, 1 - Math.abs(r.smooth - 4) * 0.9);
      ringsRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const target = wanted * (i === 0 ? 0.55 : 0.3);
        mat.opacity = reduced ? target : damp(mat.opacity, target, 4.5, dt);
        child.rotation.z += reduced ? 0 : dt * (0.04 + i * 0.012);
      });
      ringsRef.current.visible = wanted > 0.01;
    }

    /* Connect: everything converges on a single beam running down the axis of
       the corridor, terminating where the console panel sits. */
    if (beamRef.current) {
      const wanted = Math.max(0, 1 - Math.abs(r.smooth - 5) * 1.15);
      beamRef.current.children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const target = wanted * 0.42;
        mat.opacity = reduced ? target : damp(mat.opacity, target, 4, dt);
      });
      beamRef.current.visible = wanted > 0.01;
    }
  });

  /* Ring radii grow outward, one per external repository in data/stats.json.
     Held to six so the geometry keeps meaning something. */
  const ringRadii = useMemo(() => [7, 11.5, 16, 21, 26.5, 32], []);

  return (
    <>
      {/* Fog is what sells the depth and what keeps the geometry budget honest:
          distant instances dissolve instead of needing detail. */}
      <fogExp2 attach="fog" args={['#06080a', 0.0185]} />
      <color attach="background" args={['#06080a']} />

      {/* Enough ambient to keep distant geometry from going pure black, and no
          more — the depth in this scene comes from the fog and the read head. */}
      <ambientLight intensity={0.5} color="#6c7c8c" />
      <directionalLight position={[8, 18, 12]} intensity={0.55} color="#9fb3c4" />
      <pointLight
        ref={readHead}
        intensity={62}
        distance={34}
        decay={2.1}
        color="#ffd0a0"
      />

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, hall.count]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 0.085, 0.11]} />
        <meshStandardMaterial
          roughness={0.78}
          metalness={0.04}
          onBeforeCompile={(shader) => {
            // Per-instance colour without instanceColor, so the attribute name
            // cannot collide with anything drei or three sets up internally.
            shader.vertexShader = shader.vertexShader
              .replace(
                '#include <common>',
                '#include <common>\nattribute vec3 aColor;\nvarying vec3 vAColor;',
              )
              .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAColor = aColor;');
            shader.fragmentShader = shader.fragmentShader
              .replace('#include <common>', '#include <common>\nvarying vec3 vAColor;')
              .replace(
                '#include <color_fragment>',
                '#include <color_fragment>\ndiffuseColor.rgb *= vAColor * 1.95;',
              );
          }}
        />
      </instancedMesh>

      <lineSegments ref={edgeRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#e3873f" transparent opacity={0} />
      </lineSegments>

      <group ref={ringsRef} position={[0, 0, -104]} visible={false}>
        {ringRadii.map((rad, i) => (
          <mesh key={rad} rotation={[0, 0, i * 0.4]}>
            <ringGeometry args={[rad, rad + 0.055, 96]} />
            <meshBasicMaterial
              color={i === 0 ? '#e3873f' : '#5c6a76'}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* The beam sits ahead of the camera rather than around it.
          The first attempt was a wide cone centred on the camera at station 5,
          which put the camera *inside* the volume and flooded the entire
          section with orange — a lens-flare demo, and a straight breach of the
          rule that the accent gets one or two per cent of the pixels. It is now
          a thin line receding to the vanishing point, which is what a beam
          terminating on the console was supposed to look like. */}
      <group ref={beamRef} position={[0, -0.4, -186]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 46, 6, 1, true]} />
          <meshBasicMaterial color="#ffb067" transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
