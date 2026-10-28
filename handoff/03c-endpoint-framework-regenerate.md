<!-- send: editor chat · model: Claude Opus · thinking: Max · wait for: Completed card -->
Create the custom API endpoint POST /api/ai/framework-regenerate, auth required, request/response.

Context: prd.md §4.2. src/lib/framework/prompts.ts exports REGENERATE_SHELL and renderCurrentState; src/lib/framework/protocol.ts exports extractFeStatePatches and applyFeStatePatches; src/lib/framework/contract.ts exports initialFrameworkState.

Build:
- Input: { project_id }. Load the caller's framework_project (403 if not theirs).
- Replay state.chat_messages (user and assistant roles only, in order, phase_divider and system messages dropped) to the same model as framework-chat with system prompt = REGENERATE_SHELL + "\n\n# STATE BEFORE REGENERATION\n" + renderCurrentState(framework, teaching, phase). Max output tokens 8000, not streamed.
- Parse the reply with extractFeStatePatches, apply over initialFrameworkState() with applyFeStatePatches, and return { phase, framework, teaching } of the result. If no block parses, return 500 { error: "The model returned no <fe-state> block" }.
- Do not write to the entity; the client saves.

Done when: calling it from the API dashboard with the id of a project that has a transcript returns a framework object whose named_steps match the transcript.

Change only this endpoint. Do not touch: /api/ai/framework-chat (03b), src/lib/framework/prompts.ts (03a), the framework_project entity (02), any file under src/ (01).

Report: the full deployed handler source, one raw request/response sample, and an explicit list of anything you did NOT do. If something fails, report the exact error and stop.
