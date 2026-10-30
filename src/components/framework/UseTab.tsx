/**
 * "Use it" tab: the asset hub. A readiness line (name, steps, teaching), then
 * one card per output — Social posts, Email sequence, Webinar, Workshop,
 * Course — each saying what it creates. "Preview brief" opens the hand-off
 * brief (framework id, steps, teaching, voice, avatar, proof status), editable
 * before copying. "Create with MarketingSecretsAI" is not wired yet, so it is
 * shown disabled and labelled Coming soon: nothing pretends to generate.
 */
import { useState } from "react";
import { ArrowRight, Check, Copy, GraduationCap, Mail, Megaphone, MonitorPlay, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clean } from "@/lib/framework/brief";
import { ASSETS, buildAssetBrief, type AssetKind } from "@/lib/framework/export";
import { phase1Complete } from "@/lib/framework/protocol";
import { teachingDone } from "@/lib/framework/status";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import type { FrameworkProject } from "@/types";

const ICON: Record<AssetKind, typeof Mail> = { social: Megaphone, email: Mail, webinar: MonitorPlay, workshop: Users, course: GraduationCap };

export function UseTab({ project, onExport }: { project: FrameworkProject; onExport: () => void }) {
  const { framework, teaching } = project.state;
  const [open, setOpen] = useState<AssetKind | null>(null);
  const [draft, setDraft] = useState("");
  const checks = [
    { label: "Framework named", done: Boolean(clean(framework.framework_name)) },
    { label: `${teaching.steps.length || "3–7"} steps named`, done: phase1Complete(framework) },
    { label: "Teaching written for every step", done: teachingDone(project.state) },
  ];
  const ctx = {
    character: CHARACTERS.find((c) => c.id === project.setup.character_id)?.name,
    voice: VOICES.find((v) => v.id === project.setup.voice_id)?.name,
    avatar: AVATARS.find((a) => a.id === project.setup.customer_avatar_id)?.name,
  };
  const preview = (k: AssetKind) => { setDraft(buildAssetBrief(project, k, ctx)); setOpen(k); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); toast.success("Brief copied"); } catch { toast.error("Could not copy. Select the text and copy it yourself."); }
  };
  const asset = ASSETS.find((a) => a.id === open);

  return (
    <div className="space-y-7 pt-2">
      <section>
        <h3 className="font-display text-xl font-semibold tracking-tight">Create from this framework</h3>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${c.done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"}`}>{c.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
              <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {ASSETS.map((a) => {
          const Icon = ICON[a.id];
          return (
            <li key={a.id} className="flex flex-col rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.length}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/85">{a.creates}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <Button size="sm" variant="outline" className="h-8" onClick={() => preview(a.id)}>Preview brief</Button>
                <span className="text-xs text-muted-foreground">{a.tool} · Coming soon</span>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">Need the whole thing as a file?</p>
        <Button size="sm" variant="ghost" className="h-8" onClick={onExport}>Go to Export <ArrowRight className="h-3.5 w-3.5" /></Button>
      </section>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{asset?.title} brief</DialogTitle>
            <DialogDescription>This is what gets handed to {asset?.tool} in MarketingSecretsAI. Edit it before you copy it.</DialogDescription>
          </DialogHeader>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Brief" className="h-[50vh] w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-[12.5px] leading-relaxed focus:border-primary/40 focus:outline-none" />
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" disabled title="Not connected yet">Create with MarketingSecretsAI · Coming soon</Button>
            <Button onClick={() => void copy()}><Copy className="h-4 w-4" /> Copy brief</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default UseTab;
