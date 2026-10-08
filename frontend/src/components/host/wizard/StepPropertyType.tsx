import { cn } from "@/lib/cn";
import { PROPERTY_TYPES } from "@/lib/constants";
import { Icon } from "@/lib/icons";
import type { StepProps } from "./form";

export default function StepPropertyType({ form, update }: StepProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {PROPERTY_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => update({ property_type: type.value })}
          aria-pressed={form.property_type === type.value}
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 text-left transition",
            form.property_type === type.value ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
          )}
        >
          <Icon name={type.icon} className="h-8 w-8" />
          <span className="text-base font-semibold">{type.value}</span>
        </button>
      ))}
    </div>
  );
}
