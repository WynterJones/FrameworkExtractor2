<!-- send: editor chat · model: Claude Opus · thinking: Max · wait for: Completed card -->
Create the custom API endpoint POST /api/ai/framework-chat, auth required, streaming.

Context: src/lib/framework/prompts.ts (from 03a) exports CHAT_SHELL, FRAMEWORK_HYPOTHESIS_SKILL, TEACH_FRAMEWORK_SKILL, FE_STATE_PROTOCOL, FE_REPAIR_INSTRUCTION, renderCurrentState and buildChatSystemPrompt. prd.md §4.1 and §5 have the full spec.

Build:
- Input: { project_id: string, messages: [{ role: "user"|"assistant", content: string }], language?: string }. Load the caller's framework_project by project_id (403 if it is not theirs).
- If messages has 300 or more user turns, return 400 { error: "Message limit reached" }.
- Kickoff: when messages is [], send one synthetic user turn "Begin the interview. Greet the user briefly and ask the first question." It is free (no turn counted).
- System prompt = buildChatSystemPrompt({ phase: state.phase, framework: state.framework, teaching: state.teaching, voiceBlock }) where voiceBlock names the picked Attractive Character, Voice and Customer Avatar from setup (use the ids as names for now).
- Call the most capable Claude model available through the hosted AI gateway with max output tokens 8000, streaming. Stream NDJSON lines: { "type": "delta", "text" } per token chunk, then { "type": "usage", "credits": 3, "turns_used": <user turns>, "turn_limit": 300 }, then { "type": "done", "stop_reason" }. On any failure write { "type": "error", "message": <raw error> } and end; no fallback content.
- Repair round: after the reply finishes, if the visible text starts with "Generated" but the reply contains no complete <fe-state> block with teaching text, send FE_REPAIR_INSTRUCTION as one more user turn and stream only the <fe-state> block it returns.
- Never persist messages server-side; the client saves the thread.

Done when: calling the endpoint from the API dashboard with { project_id: <an existing id>, messages: [] } streams a greeting that ends with the Anchor question, and a second call with one user answer streams a reply ending in a <fe-state> block containing framework.anchor.

Change only this endpoint. Do not touch: src/lib/framework/prompts.ts (03a), the framework_project entity (02), any file under src/ (01).

Report: the full deployed handler source, one raw request/response sample, and an explicit list of anything you did NOT do. If something fails, report the exact error and stop.
