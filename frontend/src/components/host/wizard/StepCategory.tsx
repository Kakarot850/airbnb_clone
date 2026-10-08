"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Loading";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import type { Category } from "@/lib/types";
import type { StepProps } from "./form";

export default function StepCategory({ form, update }: StepProps) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  if (!categories) return <Skeleton className="h-96" />;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {categories.map((category) => {
        const selected = form.category_id === category.id;
        return (
          <button
            key={category.id}
            type="button"
            // Clicking the selected category again clears it.
            onClick={() => update({ category_id: selected ? null : category.id })}
            aria-pressed={selected}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4 text-left transition",
              selected ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
            )}
          >
            <Icon name={category.icon} className="h-8 w-8" />
            <span className="text-base font-semibold">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
