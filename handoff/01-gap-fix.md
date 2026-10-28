<!-- send: editor chat · model: Claude Opus · thinking: Max · attach: prd.md, public/screenshot.jpg · wait for: Completed card -->
Build the app shell and both screens from the attached spec. The attached prd.md is the complete product spec and the attached screenshot.jpg is the target look of the workspace; match both.

Context: this app was created by an import that failed before writing any files, so start from the scaffold. The PRD sections "2. Screens" (2.0 shell, 2.1 dashboard, 2.2 workspace) and "6. Design" have everything.

Build:
- The sidebar shell (PRD §2.0), the dashboard with the composer card and the four template buttons (§2.1), and the workspace with the layout switch, the chat column and the Framework / Teaching plan tabs (§2.2). Use the exact copy from the PRD. Dark theme by default with the tokens in §6.
- Keep every action stubbed with a toast that names the action (for example "Stubbed: send message"); do not build endpoints, AI calls or data wiring yet.
- Use placeholder data from a single file `src/lib/placeholder.ts` exporting `PLACEHOLDER_PROJECTS` (two framework_project rows copied from the PRD §3 shape, one in Phase 2 with a full teaching step, one mid Phase 1).

Done when: / and /framework/:id render every region named in prd.md §2 with the PRD copy, and the workspace matches screenshot.jpg.

Change only files under src/. Do not touch: the framework_project entity.

Report: the list of differences you found, the diff per file, and an explicit list of anything you did NOT do. If something fails, report the exact error and stop; that is a replan, not a workaround.
