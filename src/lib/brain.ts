/**
 * The Brain: MarketingSecretsAI's authorized context service. Framework
 * Extractor only reads from it (character, voice, avatar defaults) and shows a
 * quiet status. In this prototype "connected" is a per-browser flag so the
 * disconnected state can be exercised from Settings.
 */
import { useEffect, useState } from "react";
import type { FrameworkSetup } from "@/lib/framework/contract";

const KEY = "fe:brain";
const EVT = "fe:brain-change";
export const BRAIN_PROVIDER = "MarketingSecretsAI";
/** What the Brain can supply. Categories only; the content is never dumped into the UI. */
export const BRAIN_CATEGORIES = ["Attractive Character", "Voice", "Customer Avatar", "Offer", "Past stories"];
/** The Brain's defaults for a new framework (the host's primary character, voice and avatar). */
export const BRAIN_DEFAULTS: FrameworkSetup = { character_id: "ac_1", voice_id: "v_1", customer_avatar_id: "av_1" };

const read = () => { try { return localStorage.getItem(KEY) !== "off"; } catch { return true; } };

export function setBrainConnected(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVT));
}

export function useBrain() {
  const [connected, setConnected] = useState(read);
  useEffect(() => {
    const sync = () => setConnected(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return connected;
}
