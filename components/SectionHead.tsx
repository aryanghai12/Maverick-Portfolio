/**
 * The section header: an index numeral, a machine-voice label, and a rule that
 * runs to the edge of the shell. The ember tick at the left is one of the few
 * places the accent is spent.
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
        className="h-[7px] w-[7px] shrink-0 rounded-[1px] bg-[var(--ember)]"
      />
      <span className="t-label shrink-0 !text-[var(--bone-dim)]" id={id}>
        {index}
      </span>
      <span className="t-label shrink-0">{label}</span>
      <span aria-hidden className="h-px min-w-6 flex-1 bg-[var(--edge)]" />
    </div>
  );
}
