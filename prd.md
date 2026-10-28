# Framework Extractor — Product Requirements

## 1. Product

**Framework Extractor** pulls a teachable framework out of an expert's head. A Creative Director (AI) runs one continuous interview in two phases. Phase 1 extracts the structure in five stages: Anchor, Origin Story, Hypothesis (the 3–7 raw steps), Naming The Steps (Verb + Noun names), Naming The Framework. Phase 2 designs the teaching plan: for every named step, a Story, a Strategy, Tactics and a Case Study, then five scale variants (60-second to multi-day). The output is a Framework Brief the expert can download as Markdown or a slide deck.

It is for experts, coaches and agency founders who already have a method they repeat but have never named it. In the first session a user: (1) creates a project and picks the voice and audience it is written for, (2) answers the Creative Director one question at a time while the framework fills in live on the right, (3) lets the Creative Director draft teaching components they are stuck on, edits any field inline, and downloads the brief.

The repository this PRD ships with is a working prototype of the exact UI and behaviour. Every screen, string, state and the `<fe-state>` contract are implemented; only the AI, persistence and host integrations are mocked. Rebuild it faithfully; do not redesign it.

## 2. Screens

### 2.1 `/` — Project list

Layout, top to bottom: header (brand mark "Framework Extractor" with a compass icon on the left, nav link "Frameworks", avatar "J" on the right). Hero card: h1 "Framework Extractor", copy "You're already the expert — you just haven't packaged it yet. The Extractor interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.", a pill "N frameworks", the logo at the right. Controls row: primary button "New Project" (plus icon; "Creating…" while busy) and a search input, placeholder "Search projects…". The project list: one row per project with the title, a sub line "N steps mapped · Oct 28, 2026" (or "No steps yet"), a trash icon button, and a primary "Open →" button.

Actions. New Project creates a `framework_project` with title "Untitled Framework", source "empty", an empty initial state, and the setup (character, voice, avatar) copied from the user's most recently updated project when all three are set; then navigates to `/framework/:id`. Row title and Open navigate to the workspace. Trash swaps the row for an inline confirm pane: "Delete this framework?" / "“{title}” and everything extracted into it will be permanently removed. This can't be undone." with Cancel and a destructive Delete ("Deleting…" while busy). Search filters by title on the client.

States: loading "Loading your frameworks…" with a spinner; error: card "Something went wrong" + message + "Try again"; empty: card with a boxes icon, "Pull your first framework out of your head", "Start a project and the Extractor will interview you, then map your thinking into a framework you can teach and sell.", button "New Project"; no match: "No frameworks match “{q}”" / "Try a different search."

### 2.2 `/framework/:id` — Workspace

A full-frame, two-pane workspace (fixed to the viewport; each pane scrolls internally; panes stack under 1024px with the chat capped at 72vh).

Header row: outline button "← Back"; the project title as an editable input (placeholder "Name your framework") with a pencil button that focuses and selects it; a save status chip ("Saving…", "Saved", "Save failed"); outline buttons "Save" ("Retry" when the last save failed), "Markdown", "PowerPoint"; primary button "Add to Library" ("Saving…" / "In Library"). After a Library save a green notice: "Added to your Library — find it under Documents, or ask your Chief of Staff to pull it up. Saving again updates that same file."

Left pane "Creative Director" with subtitle "Phase 1 · Extracting your framework" or "Phase 2 · Designing the teaching plan". Under it the setup bar: three selects, Attractive Character, Voice (disabled until a character is picked; changing the character clears the voice), Customer Avatar. Then the chat thread, then the conversation meter ("Conversation **N / 300 messages**", chip "3 credits / reply", a progress bar that turns amber with 8 or fewer left and red at the cap), then the message box (textarea, placeholder "Type your answer… (Enter to send, Shift+Enter for newline)"; Enter sends; a Send icon button, replaced by a Stop button while streaming). At the cap the message box is replaced by a banner "Message limit reached" / "You've used all 300 messages for this framework. Your framework and teaching plan are saved — start a new project to keep going."

Chat thread rendering: user bubbles right-aligned; assistant bubbles with a sparkles avatar render markdown (bold, bullet and numbered lists, paragraphs). A brand-new project shows a start card instead of an empty thread: "Set the voice and audience, then start" / "The Creative Director pulls your framework out in the voice of one Attractive Character, for one Customer Avatar. Pick all three above so the interview sounds like you." with the primary button "Start building your framework"; the message box reads "Answer here to begin, or tap Start above…". Starting (or typing a first answer) flushes the setup save and fires the free kickoff turn. While a reply streams with no text yet, a "Generating…" card ("The Creative Director is working") shows. A reply whose first line is `**Generated {Component} for "{Step}".**` or `**Generated the full teaching for "{Step}".**` renders that line as a green done card ("Added to your teaching plan") above the rest of the bubble. When a reply moves the project to Phase 2, a divider card is inserted before it: "Framework locked" / "Switching to **Phase 2 — teaching plan**. We'll design how you'll teach each step." Errors render as a red bubble with a "Try again" button that re-sends the last turn without duplicating the user bubble. Stop keeps whatever text had arrived.

Right pane "Output" ("Flip between the framework and the teaching plan."): a segmented tab control Framework / Teaching Plan, each with a status dot (green = complete, pulsing blue = in progress, grey = not started); a toggle that hides the chat and centres the output at 900px; the scrolling output area; a footer with outline "Regenerate" and the note "20 credits".

Framework tab: heading "Extracting the framework" / "Five stages walked through with the Creative Director. Each one produces a piece of the final framework — tap any field to edit it." Five stage cards, numbered, each with a status pill (Done / In progress / Up next): 1 Anchor (fields Niche, Dream customer, Single result), 2 Origin Story (quoted block), 3 Hypothesis (numbered raw steps), 4 Naming The Steps (rows "raw step → **Named Step**", the name editable), 5 Naming The Framework (a primary-coloured card with the eyebrow "Framework name", the name and an optional tagline). Every captured field is an inline-editable textarea that reads as text until hovered. Empty stages show "Filling in from the conversation on the left…" when active, otherwise "Locks once the previous stage is complete."; pending cards are dimmed. Before anything is captured: an empty state "Nothing extracted yet" / "Answer the questions on the left and your framework fills in here."

Teaching Plan tab: a chip per step (dot green when all four components are done, blue when selected); heading "Teaching *{Step}* · Step N of M" / "Four components per framework step. Walk through them one at a time, or let the Creative Director draft them."; buttons "Remove" (destructive outline) and "Generate" (disabled while a turn streams, reads "Step complete" when all four are done). Four component cards: 1 Story "How you earned this lesson — open the teaching with this scene.", 2 Strategy "The underlying principle — the why behind the step.", 3 Tactics "The concrete how — sub-steps, tools, and pitfalls.", 4 Case Study "A named example proving the step works." Each has a pill (Done / In progress / Not completed), an editable textarea when it has text, otherwise the helper copy plus an "Edit" button that opens an empty editable field. During an auto-fill turn the empty components of that step show an animated "Generating…". Empty state: "Teaching plan not started" / "Finish the framework on Phase 1 and the teaching plan opens up here."

Actions. Title edits, setup changes, chat messages, `<fe-state>` patches and inline edits all autosave with a 1 s debounce and a flush on unmount; Save flushes immediately. Markdown downloads `{slug}.md` built from the project (see §5.4). PowerPoint builds the same brief as a 16:9 deck client-side (title slide, anchor, origin, agenda of steps, one slide per step × component, one per scale variant). Add to Library flushes, then posts the brief to the host Library. Regenerate opens a confirm dialog "Regenerate the framework?" / "This re-reads the whole conversation and rebuilds the framework and teaching plan from scratch. Any edits you have typed into the fields on the right will be overwritten. Your conversation is kept." / "Costs 20 credits" with Cancel / Regenerate. Generate sends, through the chat, the message `For the framework step "{name}", draft all four teaching components yourself — Story, Strategy, Tactics, and Case Study. Write each one straight into the teaching plan on the right. Use your best judgement from everything we have covered; I will review and tweak after.` Remove drops the step from `raw_steps`, `named_steps` and `teaching.steps`. Renaming a named step in the Framework tab renames the matching teaching step. Once Phase 1 completes and the title is still "Untitled Framework", the title becomes the framework name (one shot). When a patch sets `phase: 2` the output tab switches to Teaching Plan.

States: loading "Loading project…"; not found: "We couldn't open this framework" / "This framework doesn't exist in this workspace. Head back and pick one from the list." with "Back to frameworks".

## 3. Data model

### `framework_project` (user_scoped)

| column | type | example |
|---|---|---|
| title | text | "The Momentum Method" |
| source | text, one of `ai-interview` `voice-note` `brain-dump` `recorded-session` `empty` | "ai-interview" |
| setup | json | `{ "character_id": "ac_1", "voice_id": "v_1", "customer_avatar_id": "av_1" }` |
| state | json | the full `FrameworkProjectState` below |
| archived | boolean, default false (added in PRD, not in prototype) | false |

`id`, `created_at`, `updated_at` are platform-managed; never send them. No hard deletes: Delete sets `archived: true` and the list filters it out.

`state` shape (`src/lib/framework/types.ts` is the source of truth):

```
{
  phase: 1 | 2,
  chat_messages: [{ id, role: "user"|"assistant"|"system", content, created_at, phase_divider?: true }],
  framework: {
    anchor: { niche, dream_customer, single_result } | null,
    origin_story: string | null,
    raw_steps: string[],
    named_steps: [{ from, to }],
    framework_name: string | null,
    framework_tagline: string | null,
    stages: { anchor, origin, hypothesis, naming_steps, naming_framework }   // "pending"|"active"|"done"
  },
  teaching: {
    current_step: number,                     // 1-based
    steps: [{ name, story, strategy, tactics, case_study, components: { story, strategy, tactics, case_study } }],
    scale_variants: { sixty_second, ten_minute, sixty_minute, half_day, multi_day } | null
  }
}
```

Read-only rosters: `CHARACTERS`, `VOICES` (each with a `character_id`) and `AVATARS` are constants in `src/lib/mock/data.ts` for v1. Seed data: the two example projects in that file are demo content for the prototype only; a new account starts with an empty list, which is the correct result.

## 4. Endpoints

### 4.1 `POST /api/ai/framework-chat` — one Creative Director turn (streaming)

Auth required. Input: `{ project_id: string, messages: [{ role: "user"|"assistant", content }], language?: string }`. `messages: []` is the kickoff: the server sends one synthetic user turn so the model greets and asks the first question; it is free (no turn counted).

Behaviour: load the project; refuse with 400 "Message limit reached" when the thread already has 300 user turns; build the system prompt with `buildChatSystemPrompt({ phase, framework, teaching })` from `src/lib/framework/prompts.ts` (shell + the active phase's skill + the voice/audience block for the picked character, voice and avatar + the CURRENT STATE snapshot + the `<fe-state>` protocol); stream the model reply as NDJSON lines `{ "type": "delta", "text" }`, then `{ "type": "usage", "credits": 3, "turns_used", "turn_limit": 300 }`, then `{ "type": "done", "stop_reason" }`; on failure `{ "type": "error", "message" }` and stop. Repair round: if the finished reply opens with "Generated …" but `detectGenerationFailure` reports `empty_plan` or `truncated`, send `FE_REPAIR_INSTRUCTION` as a synthetic user turn and splice only the returned `<fe-state>` block into the stream. The client (unchanged from the prototype) strips `<fe-state>` from the visible text, parses the patches with `extractFeStatePatches`, applies them with `applyFeStatePatches`, and autosaves. Model: the most capable Claude model available; max output tokens 8,000; never truncate the block.

### 4.2 `POST /api/ai/framework-regenerate` — rebuild from the transcript

Auth required. Input `{ project_id }`. Replays the persisted `state.chat_messages` (user and assistant only) with `REGENERATE_SHELL` + voice block + CURRENT STATE as the system prompt; expects exactly one `<fe-state>` block; parses it over a fresh initial state; returns `{ phase, framework, teaching }`. 500 with the raw error on any failure; no fallback.

### 4.3 `POST /api/framework/save-to-library` — v1 stub

Auth required. Input `{ project_id }`. Returns `{ ok: true, documentUrl: "" }`; the UI shows "In Library". The host Library integration is out of scope for v1.

## 5. AI behaviour

5.1 The Creative Director asks ONE question per turn, writes a 1–4 sentence conversational reply, and puts every captured value inside the trailing `<fe-state>` block, never in prose. It proposes candidates in the naming stages (2–3 Verb + Noun names per step; five framework names spanning result-, mechanism- and customer-implying angles) and for Strategy in Phase 2. The full methodology is the two skill bodies in `prompts.ts` (Framework Hypothesis; Teach the Framework). Those texts must be sent verbatim.

5.2 `<fe-state>` is a JSON patch: `framework` keys replace per key, arrays (`raw_steps`, `named_steps`, `teaching.steps`) replace whole, `teaching.step_updates` merge per step by number and name, `stages` / `components` / `scale_variants` merge per key. The client derives all statuses from captured text (`normalizeFramework`, `normalizeTeaching`), so the right pane and the tab dots can never disagree with the data. The Phase 1 → Phase 2 transition turn sets `phase: 2` and seeds `teaching.steps` with one entry per named step. Later teaching turns send only `step_updates`.

5.3 Latency: a normal turn streams for 5–20 s; auto-fill of a step 20–40 s; regenerate 20–60 s. The UI shows the typewriter, the "Generating…" card, and the "Generating…" dots on the auto-filled step's empty components respectively.

5.4 The Framework Brief (markdown download, Library content, deck source) is built client-side by `buildFrameworkBriefMarkdown` in `src/lib/framework/brief.ts`: name and tagline, Who this is for, What this delivers, Where this came from, The framework (numbered named steps), Step N: name with Story / Strategy / Tactics / Case Study, Scale variants.

## 6. Design

Dark theme by default. Tokens (HSL, from `src/index.css`): `--primary: 201 100% 46%` (the One2Many blue), `--primary-foreground: 0 0% 100%`, `--ring: 201 100% 46%`, background `222.2 84% 4.9%`, foreground `210 40% 98%`, card `222.2 84% 4.9%`, muted `217.2 32.6% 17.5%`, muted-foreground `215 20.2% 65.1%`, border `217.2 32.6% 17.5%`, destructive `0 62.8% 30.6%`, `--radius: 0.5rem`. Fonts: display Sora, body Figtree. Status colours: done = emerald-500/600, active = primary, pending = muted. The Creative Director pane icon is red-tinted, the Output pane icon green-tinted. Buttons press with `active:scale-[0.96]`. Numbers use `tabular-nums`. Components: shadcn `Button`, `Input`, `Select`, `AlertDialog`, sonner toasts, lucide icons. Match `public/screenshot.jpg` (the workspace) and the prototype's rendering exactly.

## 7. Out of scope for v1

- Voice-note, brain-dump and recorded-session intake. Keep the `source` column; only `ai-interview` and `empty` are produced.
- Credit balance display and deduction; the "3 credits / reply" and "20 credits" labels stay as static copy, the 300-message cap is enforced.
- Team Brain facts, work-context pulls, replies in languages other than English.
- The host Library integration (4.3 is a stub) and PowerPoint export beyond the client-side deck.
- Light theme.

## 8. Constraints

Fail fast, no silent catches. Compare all ids with `String(a).trim()===String(b).trim()`. No client-supplied ids into `create()`. Identity from `getAuthContext` only, never from the request body. No hard deletes anywhere; use status/revoked/archived flags. Do not add client-side pruning: a local row absent from a server response must never be deleted; absence means unknown. Never rewrite a file over 200 lines from memory; use targeted edits. Report the full deployed source of all touched endpoints, client diffs, and an explicit not-done list. When I say an empty result is correct, do not seed data.
