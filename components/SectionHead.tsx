/**
 * The section header: an index numeral, a machine-voice label, and a rule that
 * runs to the edge of the shell.
 */
export function SectionHead({
  index,
  label,
  id,
}: {
  index: string;
  label: string;
  id?: string;
}) {
  return (
    <div className="mb-12 flex items-center gap-4 sm:mb-16" data-rv>
      <span
        aria-hidden
        className="h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--bone)]"
      />
      <span className="t-label shrink-0 !text-[var(--bone-dim)]" id={id}>
        {index}
      </span>
      <span className="t-label shrink-0">{label}</span>
      <span aria-hidden className="h-px min-w-6 flex-1 bg-[var(--edge)]" />
    </div>
  );
}
