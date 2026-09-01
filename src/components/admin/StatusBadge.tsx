import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/loan-status";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/35",
  success: "bg-success/12 text-success border-success/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
