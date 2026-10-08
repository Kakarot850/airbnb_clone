import { DESCRIPTION_MAX, type StepProps } from "./form";

export default function StepDescription({ form, update }: StepProps) {
  return (
    <div>
      <textarea
        value={form.description}
        onChange={(event) => update({ description: event.target.value.slice(0, DESCRIPTION_MAX) })}
        rows={9}
        autoFocus
        placeholder="You'll have a great time at this comfortable place to stay."
        className="w-full rounded-xl border border-faint bg-canvas p-5 text-lg outline-none focus:border-ink focus:ring-1 focus:ring-ink"
      />
      <p className="mt-2 text-sm font-semibold text-muted">
        {form.description.length}/{DESCRIPTION_MAX}
      </p>
    </div>
  );
}
