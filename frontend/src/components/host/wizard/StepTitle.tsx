import { TITLE_MAX, type StepProps } from "./form";

export default function StepTitle({ form, update }: StepProps) {
  return (
    <div>
      <textarea
        value={form.title}
        onChange={(event) => update({ title: event.target.value.slice(0, TITLE_MAX) })}
        rows={3}
        autoFocus
        placeholder="Cozy cabin with a view of the lake"
        className="w-full rounded-xl border border-faint bg-canvas p-5 text-2xl font-semibold outline-none focus:border-ink focus:ring-1 focus:ring-ink"
      />
      <p className="mt-2 text-sm font-semibold text-muted">
        {form.title.length}/{TITLE_MAX}
      </p>
    </div>
  );
}
