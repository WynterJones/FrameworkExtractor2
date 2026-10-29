/**
 * SCREEN: / — Dashboard. One job: start a framework.
 *
 * Centred composer card under a short headline: h1 "Pull the framework out
 * of your head." and a three-step strip (Answer a few
 * questions · Watch it build · Export and teach). The card holds the three
 * selects (Attractive Character, Voice, Customer Avatar; pre-filled from the
 * most recent project), a large primary CTA "Start" (disabled until all three
 * are picked; "Creating…" while busy) and a row of example chips ("Or start
 * from an example"), name only. Picking a template starts the project AND sends the template's
 * Anchor answer as the first message, so the interview is already moving.
 *
 * The list of frameworks lives in the sidebar (Shell), not here. Footer: one
 * line, brand left, copyright right.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupFields, setupComplete } from "@/components/framework/SetupBar";
import { createProject, lastSetup } from "@/lib/framework/storage";
import { TEMPLATES, type FrameworkTemplate } from "@/lib/mock/data";
import type { FrameworkSetup } from "@/lib/framework/contract";

export default function Index() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<FrameworkSetup>({});
  const [creating, setCreating] = useState<string | null>(null);
  useEffect(() => { void lastSetup().then(setSetup); }, []);

  const start = async (template?: FrameworkTemplate) => {
    if (!setupComplete(setup) || creating) return;
    setCreating(template?.id ?? "blank");
    try {
      const p = await createProject(setup, template ? "brain-dump" : "empty");
      navigate(`/framework/${p.id}`, { state: { start: true, firstAnswer: template?.anchor } });
    } finally { setCreating(null); }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Pull the framework out of your head.</h1>
          <ol className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
            {["Answer questions", "Watch it build", "Export and teach"].map((t, i) => (
              <li key={t} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-semibold">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>

        <section className="relative mt-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-card p-5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),0_30px_80px_-30px_hsl(0_0%_0%/0.8)] sm:mt-10 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <SetupFields setup={setup} onChange={(p) => setSetup((s) => ({ ...s, ...p }))} />
          <Button size="lg" className="mt-6 h-12 w-full text-base active:scale-[0.98] transition-transform duration-150" disabled={!setupComplete(setup) || !!creating} onClick={() => void start()}>
            {creating === "blank" ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Start <ArrowRight className="h-4 w-4" /></>}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{setupComplete(setup) ? "About 45 minutes." : "Pick all three to start."}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-5">
            <span className="mr-1 text-xs text-muted-foreground">Or start from an example:</span>
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" title={t.blurb} disabled={!setupComplete(setup) || !!creating} onClick={() => void start(t)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50">
                {creating === t.id && <Loader2 className="h-3 w-3 animate-spin" />}{t.name}
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-between border-t border-border px-6 py-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Framework Extractor</span>
        <span>© 2026 Framework Extractor</span>
      </footer>
    </div>
  );
}
