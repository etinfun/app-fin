import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  subValue,
  tone,
  className,
}: {
  label: string;
  value: string;
  subValue?: string;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/50 px-4 py-3 min-h-[72px] flex flex-col justify-center",
        className
      )}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tracking-tight",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
          tone === "negative" && "text-red-600 dark:text-red-400"
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
      )}
    </div>
  );
}
