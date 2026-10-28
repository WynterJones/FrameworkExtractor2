import { Check } from "lucide-react";
import type { StageStatus } from "@/lib/framework/types";

const LABEL: Record<StageStatus, string> = { done: "Done", active: "In progress", pending: "Up next" };

export function StatusPill({ status, pendingLabel }: { status: StageStatus; pendingLabel?: string }) {
  const cls = status === "done" ? "text-emerald-500" : status === "active" ? "text-primary" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      {status === "done" && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />}
      {status === "pending" && pendingLabel ? pendingLabel : LABEL[status]}
    </span>
  );
}

export function StepNum({ n }: { n: number }) {
  return <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-foreground">{n}</span>;
}
