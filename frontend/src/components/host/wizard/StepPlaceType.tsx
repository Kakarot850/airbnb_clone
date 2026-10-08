import { cn } from "@/lib/cn";
import { ROOM_TYPES } from "@/lib/constants";
import { Icon } from "@/lib/icons";
import type { StepProps } from "./form";

export default function StepPlaceType({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      {ROOM_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => update({ room_type: type.value })}
          aria-pressed={form.room_type === type.value}
          className={cn(
            "flex w-full items-center justify-between gap-6 rounded-xl border p-6 text-left transition",
            form.room_type === type.value ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
          )}
        >
          <span>
            <span className="block text-lg font-semibold">{type.title}</span>
            <span className="block text-sm text-muted">{type.description}</span>
          </span>
          <Icon name={type.icon} className="h-8 w-8 shrink-0" />
        </button>
      ))}
    </div>
  );
}
