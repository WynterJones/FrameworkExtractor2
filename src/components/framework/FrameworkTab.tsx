import { Compass } from "lucide-react";
import { EditableText } from "./EditableText";
import { StatusPill, StepNum } from "./StatusPill";
import { frameworkStageHasData } from "@/lib/framework/protocol";
import { FRAMEWORK_STAGE_KEYS, type FrameworkAnchor, type FrameworkData, type FrameworkStageKey } from "@/lib/framework/types";

const STAGE_META: Record<FrameworkStageKey, { num: number; title: string; sub: string }> = {
  anchor: { num: 1, title: "Anchor", sub: "Confirm niche, dream customer, and the single result." },
  origin: { num: 2, title: "Origin Story", sub: "The specific scene where the framework was earned." },
  hypothesis: { num: 3, title: "Hypothesis", sub: "3–7 ordered steps extracted via naive-newcomer + reverse-pass questions." },
  naming_steps: { num: 4, title: "Naming The Steps", sub: "Each raw step gets a name that earns its own teaching slot." },
  naming_framework: { num: 5, title: "Naming The Framework", sub: "The whole thing gets a name you can teach, sell, and stamp on the deck." },
};

function StageBody({ stageKey, framework, onChange }: { stageKey: FrameworkStageKey; framework: FrameworkData; onChange: (p: Partial<FrameworkData>) => void }) {
  switch (stageKey) {
    case "anchor": {
      const a = framework.anchor!;
      const set = (patch: Partial<FrameworkAnchor>) => onChange({ anchor: { ...a, ...patch } });
      return (
        <dl className="grid gap-x-3.5 gap-y-1 text-[13px] sm:grid-cols-[140px_1fr]">
          {([["Niche", "niche"], ["Dream customer", "dream_customer"], ["Single result", "single_result"]] as const).map(([label, k]) => (
            <div key={k} className="contents">
              <dt className="pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mb-1"><EditableText value={a[k]} ariaLabel={label} placeholder={label} onChange={(v) => set({ [k]: v })} /></dd>
            </div>
          ))}
        </dl>
      );
    }
    case "origin":
      return (
        <blockquote className="rounded-r-lg border-l-[3px] border-primary bg-primary/5 px-3.5 py-3 italic">
          <EditableText value={framework.origin_story ?? ""} ariaLabel="Origin story" placeholder="The origin story" onChange={(v) => onChange({ origin_story: v })} />
        </blockquote>
      );
    case "hypothesis": {
      const steps = framework.raw_steps ?? [];
      return (
        <ol className="space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-lg bg-foreground/[0.03] py-1.5 pl-2.5 pr-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
              <EditableText value={s} ariaLabel={`Step ${i + 1}`} placeholder={`Step ${i + 1}`} onChange={(v) => onChange({ raw_steps: steps.map((x, j) => (j === i ? v : x)) })} />
            </li>
          ))}
        </ol>
      );
    }
    case "naming_steps": {
      const named = framework.named_steps ?? [];
      return (
        <ul className="space-y-1.5">
          {named.map((s, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2.5 rounded-lg bg-foreground/[0.03] px-2.5 py-2 text-[13px]">
              <span className="text-muted-foreground line-through decoration-muted-foreground/60">{s.from}</span>
              <span className="font-semibold text-muted-foreground" aria-hidden>→</span>
              <span className="min-w-0 flex-1">
                <EditableText value={s.to} ariaLabel={`Name for step ${i + 1}`} placeholder="Step name" className="font-bold text-primary" onChange={(v) => onChange({ named_steps: named.map((x, j) => (j === i ? { ...x, to: v } : x)) })} />
              </span>
            </li>
          ))}
        </ul>
      );
    }
    case "naming_framework":
      return (
        <div className="mt-1 rounded-xl bg-primary px-4 py-4 text-center text-primary-foreground">
          <span className="block text-[10px] font-bold uppercase tracking-[0.1em] opacity-85">Framework name</span>
          <EditableText value={framework.framework_name ?? ""} ariaLabel="Framework name" placeholder="Framework name" className="mt-1 text-center text-[22px] font-extrabold leading-tight tracking-tight text-primary-foreground hover:bg-white/15 focus:bg-white/20 placeholder:text-primary-foreground/60" onChange={(v) => onChange({ framework_name: v })} />
          <EditableText value={framework.framework_tagline ?? ""} ariaLabel="Framework tagline" placeholder="Add a one-line tagline (optional)" className="text-center text-xs text-primary-foreground/90 hover:bg-white/15 focus:bg-white/20 placeholder:text-primary-foreground/60" onChange={(v) => onChange({ framework_tagline: v })} />
        </div>
      );
  }
}

export function FrameworkTab({ framework, onChange }: { framework: FrameworkData; onChange: (p: Partial<FrameworkData>) => void }) {
  const empty = FRAMEWORK_STAGE_KEYS.every((k) => !frameworkStageHasData(k, framework));
  return (
    <>
      <div className="mb-3.5">
        <h3 className="text-[17px] font-bold tracking-tight">Extracting the framework</h3>
        <p className="mt-1 text-[12.5px] text-muted-foreground">Five stages walked through with the Creative Director. Each one produces a piece of the final framework{empty ? "." : " — tap any field to edit it."}</p>
      </div>
      {empty ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-foreground/5"><Compass className="h-5 w-5" /></span>
          <h4 className="text-sm font-bold text-foreground">Nothing extracted yet</h4>
          <p className="max-w-[34ch] text-[12.5px]">Answer the questions on the left and your framework fills in here.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {FRAMEWORK_STAGE_KEYS.map((key) => {
            const meta = STAGE_META[key];
            const status = framework.stages[key];
            const has = frameworkStageHasData(key, framework);
            return (
              <li key={key} className={`rounded-xl border bg-card p-3.5 transition-colors ${status === "active" ? "border-primary/40" : "border-border"} ${status === "pending" ? "opacity-60" : ""} ${key === "naming_framework" && has ? "border-primary/40 bg-primary/5" : ""}`}>
                <header className="mb-1.5 flex flex-wrap items-center gap-2.5">
                  <StepNum n={meta.num} />
                  <h4 className="min-w-0 flex-1 text-sm font-bold">{meta.title}</h4>
                  <StatusPill status={status} />
                </header>
                <p className="mb-2.5 text-[12.5px] leading-snug text-muted-foreground">{meta.sub}</p>
                {has ? <StageBody stageKey={key} framework={framework} onChange={onChange} /> : (
                  <p className="text-[12.5px] italic text-muted-foreground">{status === "active" ? "Filling in from the conversation on the left…" : "Locks once the previous stage is complete."}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
export default FrameworkTab;
