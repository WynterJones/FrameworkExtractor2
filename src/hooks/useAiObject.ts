// Same signature as the scaffold's useAiObject<T>(schema, opts); the object
// comes from `opts.mock(prompt)` instead of POST /api/ai/object.
import { useState, useCallback } from "react";
import { fakeAI } from "@/lib/mock/ai";

export type JSONSchema = Record<string, unknown>;
export interface UseAiObjectOptions<T> { system?: string; mock: (prompt: string) => T; delayMs?: number }

export function useAiObject<T>(schema: JSONSchema, options: UseAiObjectOptions<T>) {
  const [object, setObject] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  void schema; // kept so the call site reads exactly like the real hook

  const generate = useCallback(async (prompt: string) => {
    if (!prompt.trim()) { setError("prompt is required"); return null; }
    setLoading(true); setError(null);
    try {
      const o = await fakeAI(() => options.mock(prompt), { prompt: options.system ?? "", delayMs: options.delayMs });
      setObject(o); return o;
    } catch (e) { setError(e instanceof Error ? e.message : "AI request failed"); return null; }
    finally { setLoading(false); }
  }, [options]);

  return { object, loading, error, generate, reset: () => { setObject(null); setError(null); } };
}
export default useAiObject;
