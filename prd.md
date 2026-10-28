# Framework Extractor — Product Requirements

## 1. Product

**Framework Extractor** pulls a teachable framework out of an expert's head. A Creative Director (AI) runs one continuous interview in two phases. Phase 1 extracts the structure in five stages: Anchor, Origin Story, Hypothesis (the 3–7 raw steps), Naming The Steps (Verb + Noun names), Naming The Framework. Phase 2 designs the teaching plan: for every named step, a Story, a Strategy, Tactics and a Case Study, then five scale variants (60-second to multi-day). The output is a Framework Brief the expert can download as Markdown or a slide deck.

It is for experts, coaches and agency founders who already have a method they repeat but have never named it. In the first session a user: (1) creates a project and picks the voice and audience it is written for, (2) answers the Creative Director one question at a time while the framework fills in live on the right, (3) lets the Creative Director draft teaching components they are stuck on, edits any field inline, and downloads the brief.

The repository this PRD ships with is a working prototype of the exact UI and behaviour. Every screen, string, state and the `<fe-state>` contract are implemented; only the AI, persistence and host integrations are mocked. Rebuild it faithfully; do not redesign it.

## 2. Screens

### 2.1 `/` — Project list

Layout, top to bottom: header (brand mark "Framework Extractor" with a compass icon on the left, nav link "Frameworks", avatar "J" on the right). Hero card (centred text, soft primary glow behind it, no image): h1 "Framework Extractor", copy "You're already the expert — you just haven't packaged it yet. The Extractor interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.", a pill "N frameworks". Controls row: primary button "New Framework" (plus icon; "Creating…" while busy) and a search input, placeholder "Search frameworks…". The project list: one row per project with the title, a sub line "N steps mapped · Oct 28, 2026" (or "No steps yet"), a trash icon button, and a primary "Open →" button.

Actions. New Framework creates a `framework_project` with title "Untitled Framework", source "empty", an empty initial state, and the setup (character, voice, avatar) copied from the user's most recently updated project when all three are set; then navigates to `/framework/:id`. Row title and Open navigate to the workspace. Trash swaps the row for an inline confirm pane: "Delete this framework?" / "“{title}” and everything extracted into it will be permanently removed. This can't be undone." with Cancel and a destructive Delete ("Deleting…" while busy). Search filters by title on the client.

States: loading "Loading your frameworks…" with a spinner; error: card "Something went wrong" + message + "Try again"; empty: card with a boxes icon, "Pull your first framework out of your head", "Start a project and the Extractor will interview you, then map your thinking into a framework you can teach and sell.", button "New Framework"; no match: "No frameworks match “{q}”" / "Try a different search."

### 2.2 `/framework/:id` — Workspace

A full-frame, two-pane workspace (fixed to the viewport; each pane scrolls internally). The two panes are side by side with a draggable vertical divider between them (default 50/50, minimum 30% each, the split remembered per browser); the right pane sits on the slightly lighter card surface so the two areas read as distinct.

Header row: outline button "← Back"; the project title as an editable input (placeholder "Name your framework") with a pencil button that focuses and selects it; a save status chip ("Saving…", "Saved", "Save failed · Retry"); an outline "Download ▾" dropdown with two items, "Markdown (.md)" and "PowerPoint (.pptx)". Everything autosaves, so there is no Save button.

Left pane: the chat, laid out as a single centred column with a maximum width of 750px (setup bar, thread and composer all share that column). It has no header. The setup bar: three selects, Attractive Character, Voice (disabled until a character is picked; changing the character clears the voice), Customer Avatar. Then the chat thread, then the conversation meter ("Conversation **N / 300 messages**", chip "3 credits / reply", a progress bar that turns amber with 8 or fewer left and red at the cap), then the message box (textarea, placeholder "Type your answer… (Enter to send, Shift+Enter for newline)"; Enter sends; a Send icon button, replaced by a Stop button while streaming). At the cap the message box is replaced by a banner "Message limit reached" / "You've used all 300 messages for this framework. Your framework and teaching plan are saved — start a new project to keep going."

Chat thread rendering follows the ChatGPT pattern: assistant replies are plain text with no bubble and no avatar, rendered as markdown (bold, bullet and numbered lists, paragraphs) at 15px with relaxed line height; user messages are right-aligned rounded bubbles on the muted background. A brand-new project shows a start card instead of an empty thread: "Set the voice and audience, then start" / "The Creative Director pulls your framework out in the voice of one Attractive Character, for one Customer Avatar. Pick all three above so the interview sounds like you." with the primary button "Start building your framework"; the message box reads "Answer here to begin, or tap Start above…". Starting (or typing a first answer) flushes the setup save and fires the free kickoff turn. While a reply streams with no text yet, a small pill "Generating… working…" shows. A reply whose first line is `**Generated {Component} for "{Step}".**` or `**Generated the full teaching for "{Step}".**` renders that line as a pill with a green check and "added to the plan" above the rest of the reply. When a reply moves the project to Phase 2, a thin divider line with a green check is inserted before it: "**Framework locked** · Phase 2, the teaching plan". Errors render as a red bubble with a "Try again" button that re-sends the last turn without duplicating the user bubble. Stop keeps whatever text had arrived.

Right pane: a header with two centred underline-style tabs, "Framework" and "Teaching plan" (each with a small status dot: green = complete, blue = in progress, grey = not started; the active tab has a 2px primary underline), and at the far right a ghost icon button that hides the chat; then the scrolling output area, its content centred at a maximum width of 750px; then a footer with "20 credits" and a ghost "Regenerate" button.

Framework tab: five stages as stacked sections separated by hairline dividers (no cards). Each section header: a numbered circle, the stage title and a status badge (rounded pill: "✓ Done" green-tinted, "• In progress" primary-tinted, "Up next" muted). 1 Anchor (a two-column definition list: Niche, Dream customer, Single result), 2 Origin Story (a left-bordered quote), 3 Hypothesis (numbered raw steps), 4 Naming The Steps (one muted row per step: a small primary-tinted number circle, the named step in semibold 15px as the editable field, and the raw description in small muted text underneath), 5 Naming The Framework (a rounded card with a primary-tinted border and a soft primary-to-transparent gradient: the name in the display font at 30px, the tagline in muted text; left-aligned). Every captured field is an inline-editable textarea that reads as text until hovered. Empty stages show "Filling in from the conversation…" when active, otherwise the stage description; pending sections are dimmed. Before anything is captured: "Nothing extracted yet" / "Answer the questions on the left and your framework fills in here, one stage at a time."

Teaching plan tab: a compact numbered stepper, centred, in a bordered rounded box, one item per step labelled "Step N" (never the step name, which is too long): a circle (number; primary when selected; green check when all four components are done); the selected item has a muted background and the full step name as its tooltip. Below it the step name as a display-font heading, with a ghost trash icon button (remove the step) and an outline "Generate all four" button on the right (hidden once all four components are done; disabled while a turn streams). Then four sections separated by hairline dividers: 1 Story "How you earned this lesson — open the teaching with this scene.", 2 Strategy "The underlying principle — the why behind the step.", 3 Tactics "The concrete how — sub-steps, tools, and pitfalls.", 4 Case Study "A named example proving the step works." Each has a status badge (Done / In progress / Not completed, same pill style as the Framework tab), an editable textarea when it has text, otherwise the helper copy plus a "Write it myself" link that opens an empty editable field. During an auto-fill turn the empty components of that step show an animated "Generating…". Empty state: "Teaching plan not started" / "Finish the framework on Phase 1 and the teaching plan opens up here."

Actions. Title edits, setup changes, chat messages, `<fe-state>` patches and inline edits all autosave with a 1 s debounce and a flush on unmount; Save flushes immediately. Download → Markdown saves `{slug}.md` built from the project (see §5.4); Download → PowerPoint builds the same brief as a 16:9 deck client-side (title slide, anchor, origin, agenda of steps, one slide per step × component, one per scale variant). Regenerate opens a confirm dialog "Regenerate the framework?" / "This re-reads the whole conversation and rebuilds the framework and teaching plan from scratch. Any edits you have typed into the fields on the right will be overwritten. Your conversation is kept." / "Costs 20 credits" with Cancel / Regenerate. Generate all four sends, through the chat, the message `For the framework step "{name}", draft all four teaching components yourself — Story, Strategy, Tactics, and Case Study. Write each one straight into the teaching plan on the right. Use your best judgement from everything we have covered; I will review and tweak after.` Remove drops the step from `raw_steps`, `named_steps` and `teaching.steps`. Renaming a named step in the Framework tab renames the matching teaching step. Once Phase 1 completes and the title is still "Untitled Framework", the title becomes the framework name (one shot). When a patch sets `phase: 2` the output tab switches to Teaching Plan.

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


## 5. AI behaviour

5.1 The Creative Director asks ONE question per turn, writes a 1–4 sentence conversational reply, and puts every captured value inside the trailing `<fe-state>` block, never in prose. It proposes candidates in the naming stages (2–3 Verb + Noun names per step; five framework names spanning result-, mechanism- and customer-implying angles) and for Strategy in Phase 2. The full methodology is the two skill bodies in `prompts.ts` (Framework Hypothesis; Teach the Framework). Those texts must be sent verbatim.

5.2 `<fe-state>` is a JSON patch: `framework` keys replace per key, arrays (`raw_steps`, `named_steps`, `teaching.steps`) replace whole, `teaching.step_updates` merge per step by number and name, `stages` / `components` / `scale_variants` merge per key. The client derives all statuses from captured text (`normalizeFramework`, `normalizeTeaching`), so the right pane and the tab dots can never disagree with the data. The Phase 1 → Phase 2 transition turn sets `phase: 2` and seeds `teaching.steps` with one entry per named step. Later teaching turns send only `step_updates`.

5.3 Latency: a normal turn streams for 5–20 s; auto-fill of a step 20–40 s; regenerate 20–60 s. The UI shows the typewriter, the "Generating…" card, and the "Generating…" dots on the auto-filled step's empty components respectively.

5.4 The Framework Brief (markdown download and deck source) is built client-side by `buildFrameworkBriefMarkdown` in `src/lib/framework/brief.ts`: name and tagline, Who this is for, What this delivers, Where this came from, The framework (numbered named steps), Step N: name with Story / Strategy / Tactics / Case Study, Scale variants.

## 6. Design

Dark theme by default: near-black surfaces, neutral greys, one ocean-blue accent. Tokens (HSL, from `src/index.css`, `.dark`): background `0 0% 4%`, foreground `0 0% 96%`, card `0 0% 9%` (the output pane and cards), popover `0 0% 11%`, primary `199 89% 48%` (ocean blue) with primary-foreground `0 0% 100%`, secondary / muted `0 0% 12%`, muted-foreground `0 0% 62%`, accent `0 0% 14%`, border / input `0 0% 16%`, ring `199 89% 48%`, destructive `0 72% 51%`, `--radius: 0.5rem`. Fonts: display Sora, body Figtree. Status colours: done = emerald-500, active = primary, pending = muted-foreground. No OverSkill badge, no avatars in the chat, no coloured icon tiles. Primary buttons are slightly three-dimensional: a top-to-bottom gradient from `--primary` to `--primary-deep: 199 89% 36%`, a 1px border in the deep shade, a 1px white inset highlight on top, a soft primary-tinted drop shadow, and on press a 1px downward shift with an inset shadow; `--primary-bright: 199 89% 54%` on hover. Other buttons press with `active:scale-[0.96]`. Numbers use `tabular-nums`. Components: shadcn `Button`, `Input`, `Select`, `DropdownMenu`, `AlertDialog`, sonner toasts, lucide icons. Match `public/screenshot.jpg` (the workspace) and the prototype's rendering exactly.

## 7. Out of scope for v1

- Voice-note, brain-dump and recorded-session intake. Keep the `source` column; only `ai-interview` and `empty` are produced.
- Credit balance display and deduction; the "3 credits / reply" and "20 credits" labels stay as static copy, the 300-message cap is enforced.
- Team Brain facts, work-context pulls, replies in languages other than English.
- Saving the brief to the host Library (removed from the UI; the production module has it).
- Light theme.

## 8. Constraints

Fail fast, no silent catches. Compare all ids with `String(a).trim()===String(b).trim()`. No client-supplied ids into `create()`. Identity from `getAuthContext` only, never from the request body. No hard deletes anywhere; use status/revoked/archived flags. Do not add client-side pruning: a local row absent from a server response must never be deleted; absence means unknown. Never rewrite a file over 200 lines from memory; use targeted edits. Report the full deployed source of all touched endpoints, client diffs, and an explicit not-done list. When I say an empty result is correct, do not seed data.
