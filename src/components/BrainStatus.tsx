import { useState } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BRAIN_CATEGORIES, BRAIN_PROVIDER, setBrainConnected, useBrain } from "@/lib/brain";

/** The tiny "Brain connected" status. Click for the provider, the categories it can supply, and reconnect when it is down. */
export function BrainStatus({ side = "bottom", align = "end", className = "" }: { side?: "top" | "bottom" | "right"; align?: "start" | "end" | "center"; className?: string }) {
  const connected = useBrain();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
        {connected ? "Brain connected" : "Brain unavailable"}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-64 p-3.5 text-sm">
        <p className="font-medium">{connected ? `Connected to ${BRAIN_PROVIDER}` : `${BRAIN_PROVIDER} Brain unavailable`}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{connected ? "Context provided by your Brain. Synced just now." : "The interview still works. You pick the character, voice and avatar yourself."}</p>
        {connected ? (
          <>
            <ul className="mt-3 space-y-1 text-xs">
              {BRAIN_CATEGORIES.map((c) => <li key={c} className="flex items-center gap-2 text-muted-foreground"><Check className="h-3 w-3 text-emerald-500" />{c}</li>)}
            </ul>
            <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">Read only: nothing is written back. <button type="button" className="underline hover:text-foreground" onClick={() => setBrainConnected(false)}>Disconnect</button></p>
          </>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="h-8" onClick={() => setBrainConnected(true)}>Reconnect</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpen(false)}>Continue without Brain</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
export default BrainStatus;
