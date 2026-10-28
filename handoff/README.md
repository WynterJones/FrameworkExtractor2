# Handoff — Framework Extractor → OverSkill (import path)

**Step 0 — do NOT import this repo again.** The 2026-10-28 import (keWLWj) hit the one-turn output cap twice ("reply got cut off before I could save any code changes"), wrote nothing, and cost ~18,700 credits. The app it created (JBYonj, "Framework Extractor") is empty but usable as the target. Build it rung by rung in that app's editor instead, starting with 01 (attach prd.md + screenshot.jpg); 01 now has to build the shell and screens, not just close gaps.

**Then, in the app's editor chat, in this order.** One file = one message. Wait for the Completed card before the next. "Guidance only:" → re-send with a build verb. Keep ONE model for the whole ladder (switching clears the prompt cache); Claude Opus (or OverSkill Max) for everything. Activate Happy Hour first.

| # | file | attach | thinking |
|---|---|---|---|
| 01 | 01-gap-fix.md | prd.md, public/screenshot.jpg | Max |
| 02 | 02-entity-framework-project.md | — | Max |
| 03a | 03a-prompts-01.md … 03a-prompts-14.md (verbatim prompt file, in order) | — | Fast |
| 03b | 03b-endpoint-framework-chat.md | — | Max |
| 03c | 03c-endpoint-framework-regenerate.md | — | Max |
| 04 | 04-wiring-workspace.md | — | Smart |
| 05 | 05-states.md | — | Smart |
| 06 | 06-polish.md | — | Fast |

Budget: import ≈ 1,200–2,000 · 01 ≈ 800–1,500 · 02 ≈ 200–400 · each 03a ≈ 100–200 · 03b/03c ≈ 600–1,200 each · 04 ≈ 600–1,200 · 05 ≈ 300–800 · 06 ≈ 200–400. Total ≈ 5,000–9,000 credits.

AI Hub → Instructions: paste `ai-hub-instructions.md` once before 01.

Mock → real map: `src/lib/mock/entities.ts` + `storage.ts` → the `framework_project` entity (02) · `fakeStream(creativeDirectorTurn(...))` in FrameworkChat.tsx → `POST /api/ai/framework-chat` (03b) · `fakeAI(() => replayInterview(...))` in Workspace.tsx → `POST /api/ai/framework-regenerate` (03c) · `src/lib/mock/interview.ts`, `ai.ts`, `entities.ts` deleted in 04 · `src/lib/mock/data.ts` rosters stay as constants (v1).

Verify at the end: a new account sees the empty list (no seeded projects); New Framework → Start → the greeting streams from the real model and asks the Anchor question; answering fills Stage 1 on the right; reload keeps everything; Regenerate rebuilds from the transcript; Download → Markdown saves the brief.
