import { AudioLines, Target, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import type { FrameworkSetup } from "@/lib/framework/contract";

export const setupComplete = (s: FrameworkSetup) => Boolean(s.character_id && s.voice_id && s.customer_avatar_id);

/** Attractive Character / Voice / Customer Avatar: the voice and audience the framework is extracted for. Picked once, before the interview starts. */
export function SetupFields({ setup, onChange }: { setup: FrameworkSetup; onChange: (p: Partial<FrameworkSetup>) => void }) {
  const voices = VOICES.filter((v) => v.character_id === setup.character_id);
  const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field icon={<User className="h-3.5 w-3.5" />} label="Attractive Character">
        <Select value={setup.character_id ?? ""} onValueChange={(v) => onChange({ character_id: v, voice_id: null })}>
          <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Choose a character" /></SelectTrigger>
          <SelectContent>{CHARACTERS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field icon={<AudioLines className="h-3.5 w-3.5" />} label="Voice">
        <Select value={setup.voice_id ?? ""} disabled={!setup.character_id} onValueChange={(v) => onChange({ voice_id: v })}>
          <SelectTrigger className="h-10 bg-background"><SelectValue placeholder={setup.character_id ? "Choose a voice" : "Pick a character first"} /></SelectTrigger>
          <SelectContent>{voices.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field icon={<Target className="h-3.5 w-3.5" />} label="Customer Avatar">
        <Select value={setup.customer_avatar_id ?? ""} onValueChange={(v) => onChange({ customer_avatar_id: v })}>
          <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Choose an avatar" /></SelectTrigger>
          <SelectContent>{AVATARS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </div>
  );
}
export default SetupFields;
