/**
 * SCREEN: / — Dashboard. One job: start a framework.
 *
 * Centred composer card under a short headline: eyebrow pill "Your method,
 * named and teachable", h1 "Pull the framework out of your head.", one
 * paragraph. The card holds the three selects (Attractive Character, Voice,
 * Customer Avatar; pre-filled from the most recent project), a row of
 * template chips ("Need a starting point?") and a large primary CTA "Start
 * building your framework" (disabled until all three are picked; "Creating…"
 * while busy). Picking a template starts the project AND sends the template's
 * Anchor answer as the first message, so the interview is already moving.
 *
 * The list of frameworks lives in the sidebar (Shell), not here. Footer: one
 * line, brand left, copyright right.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
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
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Your method, named and teachable</span>
          <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Pull the framework out of your head.</h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">A Creative Director interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.</p>
        </div>

        <section className="relative mt-8 w-full max-w-2xl rounded-3xl border border-border bg-card p-5 shadow-[0_24px_60px_-24px_hsl(0_0%_0%/0.6)] sm:mt-10 sm:p-8">
          <SetupFields setup={setup} onChange={(p) => setSetup((s) => ({ ...s, ...p }))} />
          <Button size="lg" className="mt-6 h-12 w-full text-base active:scale-[0.98] transition-transform duration-150" disabled={!setupComplete(setup) || !!creating} onClick={() => void start()}>
            {creating === "blank" ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Start building your framework <ArrowRight className="h-4 w-4" /></>}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{setupComplete(setup) ? "About 45 minutes. No prep, just answer the questions." : "Pick the voice and audience to begin."}</p>

          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Need a starting point? Begin from a template; the interview picks it up from there.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" disabled={!setupComplete(setup) || !!creating} onClick={() => void start(t)} className="flex items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.blurb}</span>
                  </span>
                  {creating === t.id && <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin" />}
                </button>
              ))}
            </div>
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
