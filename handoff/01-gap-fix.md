<!-- send: editor chat · model: Claude Opus · thinking: Max · attach: prd.md, public/screenshot.jpg · wait for: Completed card -->
Bring this imported app up to the attached spec. The attached prd.md is the complete product spec and the attached screenshot.jpg is the target look of the workspace; match both.

Context: this app was rebuilt from a GitHub import of the prototype repo. The import carried the routes (/, /framework/:id), the framework_project entity, the theme tokens and the first part of each page file. The PRD sections "2. Screens" and "6. Design" have everything the import could not see.

Build:
- Read prd.md §2 and §6 in full. List every difference between the current app and the spec (layout regions, copy, states, theme tokens, fonts, the 3D primary button, the resizable two-pane workspace, the centred 750px chat column, the Framework and Teaching plan tabs) before changing anything.
- Fix every listed difference. Use the exact copy from the PRD. Dark theme by default with the tokens in §6.
- Keep every action stubbed with a toast that names the action (for example "Stubbed: send message"); do not build endpoints, AI calls or data wiring yet.
- Use placeholder data from a single file `src/lib/placeholder.ts` exporting `PLACEHOLDER_PROJECTS` (two framework_project rows copied from the PRD §3 shape, one in Phase 2 with a full teaching step, one mid Phase 1).

Done when: / and /framework/:id render every region named in prd.md §2 with the PRD copy, and the workspace matches screenshot.jpg.

Change only files under src/. Do not touch: the framework_project entity.

Report: the list of differences you found, the diff per file, and an explicit list of anything you did NOT do. If something fails, report the exact error and stop; that is a replan, not a workaround.
