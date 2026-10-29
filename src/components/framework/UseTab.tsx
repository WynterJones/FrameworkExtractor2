/**
 * "Use it" tab: what to do with the framework once it is extracted. Shows a
 * readiness checklist (name, steps, teaching components, scale variants), then
 * one card per scale variant mapping it to the channels it fits (60-second →
 * social and ad hooks … multi-day → course), each with the variant text and a
 * Copy button, then the next-step actions (export the brief). Until the
 * teaching plan is complete the cards stay but read as locked.
 */
import { ArrowRight, Check, Copy, Download, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SCALE_VARIANT_ROWS, clean } from "@/lib/framework/brief";
import type { FrameworkData, ScaleVariants, TeachingData } from "@/lib/framework/contract";
import { phase1Complete } from "@/lib/framework/protocol";

const CHANNELS: Record<keyof ScaleVariants, { use: string; where: string[] }> = {
  sixty_second: { use: "Hooks and posts", where: ["Instagram reels and carousels", "Ad hooks and primary text", "Podcast intros"] },
  ten_minute: { use: "Emails and short teaching", where: ["Email sequences and newsletters", "Lead magnets", "YouTube shorts and podcast segments"] },
  sixty_minute: { use: "Presentations", where: ["Webinars and masterclasses", "Video sales letters", "Keynotes and guest trainings"] },
  half_day: { use: "Workshops", where: ["Paid workshops and intensives", "Client onboarding days", "Team training"] },
  multi_day: { use: "Programs", where: ["Courses and cohorts", "Coaching curriculum", "Books and certifications"] },
};

export function UseTab({ framework, teaching, busy, onExport, onAssemble }: { framework: FrameworkData; teaching: TeachingData; busy?: boolean; onExport: () => void; onAssemble: () => void }) {
  const steps = teaching.steps ?? [];
  const componentsDone = steps.length > 0 && steps.every((s) => (["story", "strategy", "tactics", "case_study"] as const).every((k) => s.components[k] === "done"));
  const variants = teaching.scale_variants ?? {};
  const variantsDone = SCALE_VARIANT_ROWS.every((r) => clean(variants[r.key]));
  const checks = [
    { label: "Framework named", done: Boolean(clean(framework.framework_name)) },
    { label: `${steps.length || "3–7"} steps named`, done: phase1Complete(framework) },
    { label: "Story, Strategy, Tactics and Case Study for every step", done: componentsDone },
    { label: "Five scale variants", done: variantsDone },
  ];
  const ready = checks.every((c) => c.done);
  const copy = async (label: string, text: string) => { await navigator.clipboard.writeText(text); toast.success(`Copied the ${label.toLowerCase()}`); };

  return (
    <div className="space-y-8 pt-2">
      <section>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ready ? "Ready to use" : "Almost there"}</p>
        <h3 className="font-display text-xl font-semibold tracking-tight">{ready ? `${clean(framework.framework_name) || "Your framework"} is ready to teach, sell and stamp on everything you make.` : "Finish the extraction to unlock the full playbook."}</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2.5 text-sm">
              <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${c.done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"}`}>{c.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
              <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-display text-[15px] font-semibold">Where it goes</h4>
        <p className="mt-1 text-sm text-muted-foreground">Every scale variant is the same framework at a different length. Pick the length that matches the channel and paste it in.</p>
        {componentsDone && !variantsDone && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
            <p className="text-sm">Every step is done. Have the Creative Director assemble the five variants from what you captured.</p>
            <Button size="sm" className="h-9" disabled={busy} onClick={onAssemble}><Sparkles className="h-4 w-4" /> Write the scale variants</Button>
          </div>
        )}
        <ol className="mt-4 divide-y divide-border rounded-xl border border-border/60 bg-background/40">
          {SCALE_VARIANT_ROWS.map((r) => {
            const text = clean(variants[r.key]);
            const ch = CHANNELS[r.key];
            return (
              <li key={r.key} className="grid gap-3 px-4 py-4 sm:grid-cols-[180px_1fr_auto]">
                <div>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{ch.use}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{ch.where.join(" · ")}</p>
                  {text ? <p className="mt-1.5 line-clamp-3 text-sm">{text}</p> : <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="h-3 w-3" /> {componentsDone ? "Not written yet." : "Written once the teaching plan is done."}</p>}
                </div>
                <Button variant="ghost" size="sm" className="h-8 self-start text-muted-foreground" disabled={!text} onClick={() => void copy(r.label, text)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h4 className="font-display text-[15px] font-semibold">Next steps</h4>
        <ol className="mt-3 space-y-2 text-sm">
          {[
            ["Export the brief", "Markdown for your notes and prompts, PDF for clients, PowerPoint to teach it live."],
            ["Teach it once at 60 minutes", "A webinar or workshop is the fastest way to find the steps that need a sharper name."],
            ["Stamp it on the offer", "Name the program after the framework and let the steps become the modules."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <p><span className="font-medium">{t}.</span> <span className="text-muted-foreground">{d}</span></p>
            </li>
          ))}
        </ol>
        <Button className="mt-5 h-10" onClick={onExport}><Download className="h-4 w-4" /> Export the brief <ArrowRight className="h-4 w-4" /></Button>
      </section>
    </div>
  );
}
export default UseTab;
