import { AudioLines, Target, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import type { FrameworkSetup } from "@/lib/framework/types";

/** Attractive Character / Voice / Customer Avatar — the voice and audience the framework is extracted for. */
export function SetupBar({ setup, onChange, disabled }: { setup: FrameworkSetup; onChange: (p: Partial<FrameworkSetup>) => void; disabled?: boolean }) {
  const voices = VOICES.filter((v) => v.character_id === setup.character_id);
  const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <label className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  );
  const trigger = "h-7 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus:ring-0 [&>span]:truncate [&>svg]:h-6 [&>svg]:w-6 [&>svg]:shrink-0 [&>svg]:rounded-full [&>svg]:border [&>svg]:border-border [&>svg]:bg-muted/60 [&>svg]:p-1.5 [&>svg]:text-muted-foreground [&>svg]:opacity-100";
  return (
    <div className="border-b border-border px-5 py-2"><div className="mx-auto flex w-full max-w-[750px] flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <Field icon={<User className="h-3 w-3" />} label="Attractive Character">
        <Select value={setup.character_id ?? ""} disabled={disabled} onValueChange={(v) => onChange({ character_id: v, voice_id: null })}>
          <SelectTrigger className={trigger}><SelectValue placeholder="Not set" /></SelectTrigger>
          <SelectContent>{CHARACTERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field icon={<AudioLines className="h-3 w-3" />} label="Voice">
        <Select value={setup.voice_id ?? ""} disabled={disabled || !setup.character_id} onValueChange={(v) => onChange({ voice_id: v })}>
          <SelectTrigger className={trigger}><SelectValue placeholder={setup.character_id ? "Not set" : "Pick a character first"} /></SelectTrigger>
          <SelectContent>{voices.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field icon={<Target className="h-3 w-3" />} label="Customer Avatar">
        <Select value={setup.customer_avatar_id ?? ""} disabled={disabled} onValueChange={(v) => onChange({ customer_avatar_id: v })}>
          <SelectTrigger className={trigger}><SelectValue placeholder="Not set" /></SelectTrigger>
          <SelectContent>{AVATARS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div></div>
  );
}
export default SetupBar;
