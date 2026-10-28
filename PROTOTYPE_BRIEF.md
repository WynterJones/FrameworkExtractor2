# Framework Extractor

**Promise:** Pull the framework out of your head. Name it. Teach it.
**Color:** 201 100% 46% (accent, the One2Many blue)  ·  **Fonts:** Sora (display) / Figtree (body)  ·  **Logo:** public/logo.jpg  ·  **Reference screenshot:** public/screenshot.jpg

Port of the production Framework Extractor module in `PrimeMoverDevelopers/RB-email` (`src/app/framework-extractor/*`, `src/components/framework-extractor/*`, `src/lib/framework-extractor/*`) to a standalone OverSkill-shaped app. The product is a two-phase Creative Director interview: Phase 1 extracts the framework (Anchor → Origin Story → Hypothesis → Naming The Steps → Naming The Framework); Phase 2 captures Story / Strategy / Tactics / Case Study for every named step, then scale variants. The AI emits `<fe-state>` JSON patches at the end of each reply; the client merges them so the right pane fills in live.

## Screens
| Route | Purpose | Regions (left→right, top→bottom) | Actions (button → effect) |
|---|---|---|---|
| `/` | Project list | Header (AppBrand "Framework Extractor" + nav "Frameworks" + avatar J). Hero card: title, pitch copy, "N frameworks" pill, logo at right. Controls row: **New Project**, search input. List: rows with title, "N steps mapped · date" (or "No steps yet"), trash icon, **Open**. States: loading ("Loading your frameworks…"), error with Try again, empty ("Pull your first framework out of your head"), no-match ("No frameworks match “q”") | New Project → `createProject()` (carries the previous project's setup forward) → navigate `/framework/:id`. Row / Open → `/framework/:id`. Trash → inline confirm pane ("Delete this framework?" Cancel / Delete) → `deleteProject`. Search → client-side title filter. |
| `/framework/:id` | Workspace (full-frame, two panes) | Header row: Back · editable title + pencil · save chip (Saving… / Saved / Save failed) · **Save** · **Markdown** · **PowerPoint** · **Add to Library**. Left pane "Creative Director" (subtitle = phase): SetupBar (Attractive Character / Voice / Customer Avatar selects), chat thread, conversation meter "N / 300 messages" + "3 credits / reply" chip + progress bar, message box with Send/Stop. Right pane "Output": tabs Framework / Teaching Plan (status dot each), collapse-chat toggle, scrolling output area, footer **Regenerate** + "20 credits". | Start building your framework (start card, new project only) → flush setup save, mark `started`, kickoff turn (`messages: []`) → greeting + Q1. Send → one chat turn (stream → strip `<fe-state>` → apply patches → autosave). Stop → abort stream, keep partial text. Try again → re-send last turn. Title input → autosave `title`. Setup selects → autosave `setup` (character change clears voice). Save → flush now. Markdown → downloads `<slug>.md` (buildFrameworkBriefMarkdown). PowerPoint → toast "Stubbed: PowerPoint export". Add to Library → flush, fake 0.9s, "In Library" + green notice. Tab buttons → switch output; a `phase: 2` patch auto-switches to Teaching Plan. Collapse toggle → hides the chat, centres output at 900px. Regenerate → AlertDialog ("Regenerate the framework?" · "Costs 20 credits") → replay transcript → replace framework + teaching → toast. Framework tab: every captured field is an inline EditableText → `framework` patch (renaming a step renames its teaching entry). Teaching tab: step chips → select step; **Generate** → sends the auto-fill message through the chat → all four components land; **Remove** → drops the step from raw_steps, named_steps and teaching; Edit → turns a blank component into an editable field. |

Auto-naming: once Phase 1 completes and the title is still "Untitled Framework", the title becomes the framework name (one-shot).

## Entities (src/lib/mock/data.ts)
| Entity | Scoping | Columns (type, example) |
|---|---|---|
| `framework_project` | per user | title (string, "The Momentum Method"), source ("ai-interview" \| "voice-note" \| "brain-dump" \| "recorded-session" \| "empty"), setup (JSON `{ character_id, voice_id, customer_avatar_id }`), state (JSON `FrameworkProjectState` — see `src/lib/framework/types.ts`: phase, chat_messages[], framework { anchor, origin_story, raw_steps[], named_steps[{from,to}], framework_name, framework_tagline, stages }, teaching { current_step, steps[{name, story, strategy, tactics, case_study, components}], scale_variants }) — 2 seeded rows (one complete Phase 2 project, one mid-Phase 1) |

Read-only rosters (host-platform data in production, constants here): `CHARACTERS` (3), `VOICES` (4, keyed by character_id), `AVATARS` (3) in `src/lib/mock/data.ts`.

## Endpoints / AI calls (grep fakeAI, fakeStream, fakeJob, useAiChat, useAiObject)
| Call site | Becomes | Input | Output | Prompt |
|---|---|---|---|---|
| `src/components/framework/FrameworkChat.tsx` `runTurn()` — `fakeStream(creativeDirectorTurn(state, text), …, { prompt: buildChatSystemPrompt(...) })` | `POST /api/ai/framework-chat` — streaming (NDJSON `{type:"delta",text}` … `{type:"done"}`); `messages: []` = free kickoff greeting | `project_id`, full `messages[]` (user/assistant, no system/divider), `language` | raw assistant markdown ending in ONE `<fe-state>` JSON patch (contract in `src/lib/framework/protocol.ts`) | `buildChatSystemPrompt()` in `src/lib/framework/prompts.ts` = CHAT_SHELL + active skill (FRAMEWORK_HYPOTHESIS_SKILL / TEACH_FRAMEWORK_SKILL) + voice/audience block + renderCurrentState + FE_STATE_PROTOCOL. Server also runs the FE_REPAIR_INSTRUCTION round when a "Generated …" reply carries no block. |
| `src/pages/Workspace.tsx` `handleRegenerate()` — `fakeAI(() => replayInterview(userTurns), { prompt: REGENERATE_SHELL })` | `POST /api/ai/framework-regenerate` (request/response, ~20–60s) | `project_id` (server replays the persisted transcript) | `{ phase, framework, teaching }` parsed from one consolidated `<fe-state>` block | `REGENERATE_SHELL` + voice block + renderCurrentState |
| `src/pages/Workspace.tsx` `saveToLibrary()` — `fakeAI(null, …)` | `POST /api/framework/save-to-library` (host Library integration; v1 stub) | `project_id` | `{ ok, documentUrl }` | none |

## What is faked
- The Creative Director is `src/lib/mock/interview.ts`: a deterministic script that asks the real questions in order, locks the user's words verbatim, proposes Verb + Noun step names and five framework-name candidates with a heuristic, proposes a templated Strategy, drafts templated Story / Tactics / Case Study on delegation ("you write it") or auto-fill, and assembles scale variants. On OverSkill every reply comes from the model with the prompts in `prompts.ts`; the `<fe-state>` wire format and all client-side merging (`protocol.ts`) stay exactly as they are.
- Kickoff greeting, streaming typewriter, Stop, error + Try again, truncated-block detection: the client logic is real; the transport is `fakeStream`.
- Regenerate replays the transcript through the same script; real app re-reads the transcript with the model.
- Credits: "3 credits / reply", "20 credits" and the 300-message cap are displayed and the cap is enforced client-side; no balance is fetched or deducted.
- Setup rosters (Attractive Characters, Voices, Customer Avatars) are constants; in production they come from the host platform (`/api/cos-acs`, `/api/cos-acs/:id/voices`, customer avatars endpoint).
- PowerPoint export → toast (production uses pptxgenjs client-side; same slide order as the markdown brief).
- Add to Library → toast + "In Library" state; nothing is written anywhere.
- Delete is a hard delete in the prototype; the PRD asks for an `archived` flag.
- Auth: mock user "Jordan Lee" (avatar J); no sign-in screen; one workspace.

## Out of scope for v1
- Voice-note / brain-dump / recorded-session intake (the `source` values exist; only `ai-interview` is reachable).
- Team Brain facts capture, work-context pulls, multi-language replies (production has all three).
- Light theme (dark is the default; tokens are in place).
- Real billing, balance display, host-platform embed auth.
