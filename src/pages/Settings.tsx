/** SCREEN: /settings — Framework Extractor's own settings. The Brain connection lives here, not in the navigation. */
import { Switch } from "@/components/ui/switch";
import { BRAIN_CATEGORIES, BRAIN_PROVIDER, setBrainConnected, useBrain } from "@/lib/brain";
import { PageHeader } from "./Index";

export default function Settings() {
  const connected = useBrain();
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader title="Settings" />
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Brain context</h2>
              <p className="mt-1 text-sm text-muted-foreground">Read your character, voice, audience, offer and past stories from your {BRAIN_PROVIDER} Brain. Nothing is written back without asking you first.</p>
            </div>
            <Switch checked={connected} onCheckedChange={setBrainConnected} aria-label="Use Brain context" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{connected ? `Available: ${BRAIN_CATEGORIES.join(", ")}.` : "Off. You pick the character, voice and audience yourself for each framework."}</p>
        </section>
      </div>
    </div>
  );
}
