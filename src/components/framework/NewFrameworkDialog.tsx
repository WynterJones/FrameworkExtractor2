import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AudioLines, Loader2, Target, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SetupFields, setupComplete } from "./SetupBar";
import { BrainStatus } from "@/components/BrainStatus";
import { createProject, lastSetup } from "@/lib/framework/storage";
import { BRAIN_DEFAULTS, useBrain } from "@/lib/brain";
import { AVATARS, CHARACTERS, TEMPLATES, VOICES } from "@/lib/mock/data";
import type { FrameworkSetup } from "@/lib/framework/contract";

/**
 * Start a framework: one optional freeform line ("I help [who] achieve
 * [result] by..."), the character / voice / audience as small name chips
 * (defaults from the Brain, or the last framework), and "Start extracting".
 * The line, if given, is sent as the first answer so the interview starts moving.
 */
export function NewFrameworkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const brain = useBrain();
  const [exampleId, setExampleId] = useState<string | null>(null);
  const example = TEMPLATES.find((t) => t.id === exampleId);
  const [text, setText] = useState("");
  const [setup, setSetup] = useState<FrameworkSetup>({});
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(""); setExampleId(null);
    void lastSetup().then((s) => {
      const next = setupComplete(s) ? s : brain ? BRAIN_DEFAULTS : {};
      setSetup(next); setEditing(!setupComplete(next));
    });
  }, [open, brain]);
  const pickExample = (id: string) => { const t = TEMPLATES.find((x) => x.id === id); setExampleId(id); setText(t?.anchor.replace(/; /g, "\n") ?? ""); };

  const start = async () => {
    if (!setupComplete(setup) || creating) return;
    setCreating(true);
    try {
      const p = await createProject(setup, text.trim() ? "brain-dump" : "empty", example?.name);
      onClose();
      navigate(`/framework/${p.id}`, { state: { start: true, firstAnswer: text.trim() || undefined } });
    } finally { setCreating(false); }
  };

  const chips = [
    { Icon: User, label: "Character", name: CHARACTERS.find((c) => c.id === setup.character_id)?.name },
    { Icon: AudioLines, label: "Voice", name: VOICES.find((v) => v.id === setup.voice_id)?.name },
    { Icon: Target, label: "Audience", name: AVATARS.find((a) => a.id === setup.customer_avatar_id)?.name },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="relative h-44 overflow-hidden" aria-hidden>
          <img src="/new-framework.webp" alt="" className="h-full w-full object-cover object-[center_45%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
        <DialogHeader className="-mt-6 relative space-y-1 px-6 pb-4 text-left">
          <DialogTitle className="pr-8 font-display text-xl">What would you like to turn into a framework?</DialogTitle>
          <DialogDescription>Optional. You can also just start talking.</DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <textarea value={text} onChange={(e) => { setText(e.target.value); if (!e.target.value.trim()) setExampleId(null); }} rows={4} autoFocus aria-label="What you help people do"
            placeholder="I help [who] achieve [result] by…" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void start(); }}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15" />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {chips.map(({ Icon, label, name }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs">
                <Icon className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{label}:</span> {name ?? <span className="text-muted-foreground">not set</span>}
              </span>
            ))}
            <button type="button" onClick={() => setEditing((e) => !e)} className="ml-1 text-xs font-medium text-primary hover:underline">{editing ? "Done" : "Change"}</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">Or start from an example:</span>
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" title={t.blurb} aria-pressed={exampleId === t.id} onClick={() => pickExample(t.id)} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${exampleId === t.id ? "border-primary/50 bg-primary/15 text-foreground" : "border-dashed border-border text-muted-foreground hover:text-foreground"}`}>{t.name}</button>
            ))}
          </div>
          {editing && <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-3"><SetupFields setup={setup} onChange={(p) => setSetup((s) => ({ ...s, ...p }))} /></div>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
          <BrainStatus side="top" align="start" />
          <Button className="ml-auto h-10" disabled={!setupComplete(setup) || creating} onClick={() => void start()}>
            {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <>Start extracting <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default NewFrameworkDialog;
