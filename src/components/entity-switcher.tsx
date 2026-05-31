"use client";

import { cn } from "@/lib/utils";
import { useEntityContext, type EntityFilter } from "@/components/entity-context";

export function EntitySwitcher({ className }: { className?: string }) {
  const { entities, selectedEntityId, setSelectedEntityId } = useEntityContext();

  const options: { id: EntityFilter; label: string }[] = [
    ...entities.map((e) => ({ id: e.id, label: e.name })),
    { id: "all", label: "All" },
  ];

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setSelectedEntityId(opt.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px]",
            selectedEntityId === opt.id
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground active:bg-muted/80"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
