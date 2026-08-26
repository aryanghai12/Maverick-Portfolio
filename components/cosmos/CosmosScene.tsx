'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  STAGE_CAMERA,
  STAGE_COUNT,
  buildAttributes,
  buildStages,
} from './shapes';
import { damp, measureStations, progressFor, type StationTable } from '@/lib/stations';

/**
 * One particle field, seven forms, driven entirely by scroll position.
 *
 * The field is a single THREE.Points. Every stage's target positions are
 * precomputed once into a contiguous buffer, and a morph is two typed-array
 * copies plus a uniform: no per-frame geometry rebuild, no allocation inside
 * the render loop, nothing for the garbage collector to notice.
 *
 * Interpolation is scroll-linked rather than time-linked on purpose. Scrubbing
 * back up the page runs the morph backwards exactly, which is what makes the
 * thing feel like an object being turned over rather than a video being played
 * at you.
 */

const COUNT_DESKTOP = 16000;
const COUNT_TABLET = 9000;
const COUNT_MOBILE = 4200;

/* Blue at one edge, red at the other, violet where they meet. The gradient is
   computed from world X in the vertex shader rather than baked per particle, so
   it survives every morph and never has to be regenerated. */
const C_BLUE = new THREE.Color('#2f6bff').convertSRGBToLinear();
const C_VIOLET = new THREE.Color('#a855f7').convertSRGBToLinear();
const C_RED = new THREE.Color('#ff3355').convertSRGBToLinear();

/** How brightly the centre of the form glows, per stage. */
const CORE = [0, 0.15, 0.1, 0, 0, 0.1, 1];

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uSpread;
  uniform float uBurst;
  uniform vec2 uPointer;

  attribute vec3 aTo;
  attribute float aSeed;
  attribute float aScale;

  varying float vTint;
  varying float vFade;
  varying float vSeed;

  void main() {
    // Ease the morph so points leave and arrive slowly and cross fast, which is
    // what makes a transition read as motion rather than as a crossfade.
    float m = uMix * uMix * (3.0 - 2.0 * uMix);
    vec3 pos = mix(position, aTo, m);

    // Mid flight the field breathes outward. Peaks at the halfway point and is
    // exactly zero at both ends, so a settled form is never disturbed by it.
    float bulge = sin(uMix * 3.14159265) * uBurst;
    vec3 dir = normalize(pos + vec3(0.0001));
    pos += dir * bulge * (0.5 + aSeed);

    // Idle drift. Small, slow, and different for every particle, so a form at
    // rest is still alive without anything visibly oscillating.
    float t = uTime * 0.25 + aSeed * 6.2831;
    pos.x += sin(t * 0.9) * 0.09;
    pos.y += cos(t * 0.75) * 0.09;
    pos.z += sin(t * 0.6 + 1.7) * 0.09;

    vTint = clamp(pos.x / uSpread * 0.5 + 0.5 + (aSeed - 0.5) * 0.14, 0.0, 1.0);
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Depth fade, so the far side of a form recedes instead of stacking up into
    // a bright wall behind the near side.
    vFade = 1.0 - smoothstep(10.0, 90.0, -mv.z);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (90.0 / max(-mv.z, 1.0));
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uCA;
  uniform vec3 uCB;
  uniform vec3 uCC;
  uniform float uOpacity;
  uniform float uCore;

  varying float vTint;
  varying float vFade;
  varying float vSeed;

  void main() {
    // Round sprite with a soft shoulder. No texture: a smoothstep on the point
    // coordinate is one instruction and never loads a file.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = 1.0 - smoothstep(0.08, 0.5, d);
    if (alpha < 0.01) discard;

    vec3 col = vTint < 0.5
      ? mix(uCA, uCB, vTint * 2.0)
      : mix(uCB, uCC, (vTint - 0.5) * 2.0);

    // A minority of points run hot. Without this every particle is the same
    // brightness and the field flattens into a single sheet of colour.
    col += vec3(0.55) * smoothstep(0.82, 1.0, vSeed) * 0.8;

    // The lit core, used by the stages that have one.
    col = mix(col, vec3(1.0), uCore * (1.0 - smoothstep(0.0, 0.34, d)) * 0.5);

    gl_FragColor = vec4(col, alpha * uOpacity * vFade);
  }
`;

export function CosmosScene({ reduced }: { reduced: boolean }) {
  const { camera, size, viewport } = useThree();

  const count = useMemo(() => {
    if (size.width < 700) return COUNT_MOBILE;
    if (size.width < 1200) return COUNT_TABLET;
    return COUNT_DESKTOP;
  }, [size.width]);

  const stages = useMemo(() => buildStages(count), [count]);
  const attrs = useMemo(() => buildAttributes(count), [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // `position` doubles as the morph's start point. Three needs the attribute
    // to exist anyway, so spending a second buffer on the same data would be
    // pure overhead.
    g.setAttribute('position', new THREE.BufferAttribute(stages.slice(0, count * 3), 3));
    g.setAttribute('aTo', new THREE.BufferAttribute(stages.slice(count * 3, count * 6), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(attrs.seed, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(attrs.scale, 1));
    // The shader moves points well outside their initial bounds, so leave
    // culling to the caller rather than letting three cull a visible field.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
    return g;
  }, [stages, attrs, count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMix: { value: 0 },
      uSize: { value: 1 },
      uPixelRatio: { value: 1 },
      uSpread: { value: STAGE_CAMERA[0].spread },
      uBurst: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uOpacity: { value: 0 },
      uCore: { value: 0 },
      uCA: { value: C_BLUE },
      uCB: { value: C_VIOLET },
      uCC: { value: C_RED },
    }),
    [],
  );

  /* The material is constructed here rather than declared as <shaderMaterial>
     with a uniforms prop.
     
     Declaring it in JSX hands the uniforms object to the reconciler, and what
     the material ends up holding is not guaranteed to be the object this
     component keeps mutating every frame. When it is not, every uniform write
     lands on a detached object: the field compiles, draws, and renders with
     uOpacity stuck at its initial zero, which looks exactly like WebGL being
     unavailable and reports no error at all. Building it by hand removes the
     question. */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(viewport.dpr ?? 1, 2);
  }, [viewport.dpr, uniforms]);

  /* Which slice of the stage buffer is currently loaded. Tracked so the copy
     happens on a stage boundary and not on every frame. */
  const loaded = useRef(-1);

  const table = useRef<StationTable>({ anchors: [0], count: 1 });
  useEffect(() => {
    const remeasure = () => {
      table.current = measureStations('[data-stage]');
    };
    remeasure();
    // Sections settle after webfonts land and the reveals run; one late pass
    // catches the final heights without polling.
    const t = setTimeout(remeasure, 1200);
    window.addEventListener('resize', remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', remeasure);
      ro.disconnect();
    };
  }, []);

  const rig = useRef({
    prog: 0,
    smooth: 0,
    px: 0,
    py: 0,
    tpx: 0,
    tpy: 0,
    /* Opening move: the field arrives from further away over the first second
       and a half. Completed instantly by any scroll input, because an intro a
       visitor cannot skip is an intro they resent. */
    intro: reduced ? 1 : 0,
    spin: 0,
  });

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      rig.current.tpx = (e.clientX / window.innerWidth) * 2 - 1;
      rig.current.tpy = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const skip = () => {
      rig.current.intro = Math.max(rig.current.intro, 0.7);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('wheel', skip, { passive: true, once: true });
    window.addEventListener('touchstart', skip, { passive: true, once: true });
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchstart', skip);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const pts = pointsRef.current;
    if (!pts) return;

    // A tab that was backgrounded returns with a huge delta; clamping keeps the
    // easing from snapping across three sections in one frame.
    const dt = Math.min(rawDelta, 0.05);
    const r = rig.current;

    r.intro = Math.min(1, r.intro + dt * 0.62);
    const intro = r.intro * r.intro * (3 - 2 * r.intro);

    const raw = progressFor(window.scrollY, table.current);
    // Clamp to the number of forms actually available, in case a section is
    // added to the page without a matching stage being written.
    r.prog = Math.min(raw, STAGE_COUNT - 1);
    r.smooth = damp(r.smooth, r.prog, 5.2, dt);

    const stage = Math.min(Math.floor(r.smooth), STAGE_COUNT - 2);
    const mix = Math.min(1, Math.max(0, r.smooth - stage));

    if (loaded.current !== stage) {
      const from = geometry.getAttribute('position') as THREE.BufferAttribute;
      const to = geometry.getAttribute('aTo') as THREE.BufferAttribute;
      const n3 = count * 3;
      (from.array as Float32Array).set(stages.subarray(stage * n3, (stage + 1) * n3));
      (to.array as Float32Array).set(stages.subarray((stage + 1) * n3, (stage + 2) * n3));
      from.needsUpdate = true;
      to.needsUpdate = true;
      loaded.current = stage;
    }

    const a = STAGE_CAMERA[stage];
    const b = STAGE_CAMERA[stage + 1];
    const e = mix * mix * (3 - 2 * mix);

    // Under reduced motion the clock stops. The morph itself is left alone: it
    // is driven by the visitor's own scrolling, not by anything running on its
    // own, and freezing it would strand the field on whichever form it started.
    uniforms.uTime.value += reduced ? 0 : dt;
    uniforms.uMix.value = mix;
    uniforms.uSpread.value = a.spread + (b.spread - a.spread) * e;
    uniforms.uOpacity.value = (a.opacity + (b.opacity - a.opacity) * e) * intro;
    uniforms.uCore.value = CORE[stage] + (CORE[stage + 1] - CORE[stage]) * e;
    // The burst is strongest in the middle of a transition and gone at rest.
    uniforms.uBurst.value = reduced ? 0 : 2.4;
    uniforms.uSize.value = size.width < 700 ? 1.35 : 1.15;

    // Pointer parallax. Damped hard: the field should answer the pointer, not
    // follow it, and a 1:1 response reads as a toy.
    r.px = damp(r.px, r.tpx, 3.4, dt);
    r.py = damp(r.py, r.tpy, 3.4, dt);

    const spin = a.spin + (b.spin - a.spin) * e;
    r.spin += dt * spin * (reduced ? 0 : 1);
    pts.rotation.y = r.spin + r.px * 0.12;
    pts.rotation.x = -r.py * 0.08;

    /* Camera. Pulled back during the intro, then held close to the stage's own
       framing for the rest of the page.
       
       A phone frame is roughly half as wide as it is tall, so a form framed to
       fill a 16:10 desktop viewport runs off both sides of it and stops reading
       as an object at all. The whole rig steps back rather than each form being
       authored twice. */
    const fit = size.width < 700 ? 1.45 : size.width < 1100 ? 1.14 : 1;
    const z = (a.z + (b.z - a.z) * e) * fit + (1 - intro) * 26;
    const y = a.y + (b.y - a.y) * e;
    camera.position.set(r.px * 0.7, y + r.py * -0.4, z);
    camera.lookAt(0, y * 0.35, 0);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
