/**
 * "Use it" tab: a short guide to what to do with the framework once it is
 * extracted. A readiness line with a three-item checklist (name, steps,
 * teaching components), then "Where it goes" (five length cards, each the
 * channels it fits and a one-line how), "How to teach it" (four principles)
 * and "Next steps" with an Export button. Education only: no data, no copy.
 */
import { ArrowRight, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clean } from "@/lib/framework/brief";
import type { FrameworkData, TeachingData } from "@/lib/framework/contract";
import { phase1Complete } from "@/lib/framework/protocol";

const LENGTHS: { length: string; use: string; where: string; how: string }[] = [
  { length: "60 seconds", use: "Hooks and posts", where: "Reels, carousels, ad hooks, podcast intros", how: "Say the name, list the steps, promise the single result. That is the whole post." },
  { length: "10 minutes", use: "Emails and short teaching", where: "Email sequences, newsletters, lead magnets, shorts", how: "Open with the origin story, then one step per email with its strategy line." },
  { length: "60 minutes", use: "Presentations", where: "Webinars, masterclasses, video sales letters, keynotes", how: "Story first, then every step with its strategy. Keep the tactics for the offer." },
  { length: "Half a day", use: "Workshops", where: "Paid intensives, client onboarding, team training", how: "Teach strategy and tactics for each step and have the room do the first one live." },
  { length: "Multiple days", use: "Programs", where: "Courses, cohorts, coaching curriculum, books", how: "One module per step: story, strategy, tactics, then the case study as homework." },
];

const PRINCIPLES: [string, string][] = [
  ["One framework, every length", "You never write new material. You pick how much of each step to show for the channel."],
  ["Always open with the story", "The origin story is what makes the steps believable. Lead with it at every length."],
  ["Teach the strategy, sell the tactics", "Free content explains why each step works. Paid content shows exactly how to do it."],
  ["Name it everywhere", "Use the framework name in bios, titles, offers and slides until people repeat it back to you."],
];

export function UseTab({ framework, teaching, onExport }: { framework: FrameworkData; teaching: TeachingData; onExport: () => void }) {
  const steps = teaching.steps ?? [];
  const componentsDone = steps.length > 0 && steps.every((s) => (["story", "strategy", "tactics", "case_study"] as const).every((k) => s.components[k] === "done"));
  const checks = [
    { label: "Framework named", done: Boolean(clean(framework.framework_name)) },
    { label: `${steps.length || "3–7"} steps named`, done: phase1Complete(framework) },
    { label: "Story, Strategy, Tactics and Case Study for every step", done: componentsDone },
  ];
  const ready = checks.every((c) => c.done);
  const name = clean(framework.framework_name) || "Your framework";

  return (
    <div className="space-y-9 pt-2">
      <section>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ready ? "Ready to use" : "Almost there"}</p>
        <h3 className="font-display text-xl font-semibold tracking-tight">{ready ? `${name} is ready to teach, sell and stamp on everything you make.` : "Finish the extraction, then this is how you put it to work."}</h3>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${c.done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"}`}>{c.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
              <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-display text-[15px] font-semibold">Where it goes</h4>
        <p className="mt-1 text-sm text-muted-foreground">The same framework at five lengths. Match the length to the channel.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {LENGTHS.map((l, i) => (
            <li key={l.length} className={`rounded-xl border border-border/60 bg-background/40 p-4 ${i === LENGTHS.length - 1 ? "sm:col-span-2" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{l.length}</p>
              <p className="mt-0.5 text-sm font-semibold">{l.use}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{l.where}</p>
              <p className="mt-2.5 text-sm text-foreground/85">{l.how}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h4 className="font-display text-[15px] font-semibold">How to teach it</h4>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border/60 bg-background/40">
          {PRINCIPLES.map(([t, d]) => (
            <li key={t} className="px-4 py-3">
              <p className="text-sm font-medium">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
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
