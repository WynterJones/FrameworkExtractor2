// Fake AI. Every "AI" feature in a prototype goes through here so the handoff
// skill can find it: grep fakeAI / fakeStream and each call becomes one real
// /api/ai/* endpoint on OverSkill. Keep the prompt text in the call so it
// transfers verbatim into the PRD.

export interface FakeAIOptions {
  /** Shown in the PRD as the system prompt this call will use for real. */
  prompt: string;
  /** Wall time to fake. Default 900–1800ms. */
  delayMs?: number;
}

/** Resolve a canned result after a realistic delay. */
export async function fakeAI<T>(result: T | (() => T), opts: FakeAIOptions): Promise<T> {
  const ms = opts.delayMs ?? 900 + Math.random() * 900;
  await new Promise((r) => setTimeout(r, ms));
  return typeof result === "function" ? (result as () => T)() : result;
}

/** Typewriter: calls onChunk with the growing text. Resolves when complete. */
export async function fakeStream(
  text: string,
  onChunk: (soFar: string) => void,
  opts: FakeAIOptions & { charsPerTick?: number; tickMs?: number } = { prompt: "" }
): Promise<string> {
  const step = opts.charsPerTick ?? 3, tick = opts.tickMs ?? 18;
  await new Promise((r) => setTimeout(r, opts.delayMs ?? 500));
  for (let i = step; i <= text.length + step; i += step) {
    onChunk(text.slice(0, i));
    await new Promise((r) => setTimeout(r, tick));
  }
  return text;
}

/** Run named steps with a delay each; onStep fires before each starts. Mirrors a long AI job (VSL render, extraction). */
export async function fakeJob(
  steps: string[],
  onStep: (index: number, label: string) => void,
  opts: { perStepMs?: number } = {}
): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    onStep(i, steps[i]);
    await new Promise((r) => setTimeout(r, opts.perStepMs ?? 700 + Math.random() * 600));
  }
}
