<!-- send: editor chat · model: Claude Opus · thinking: Smart · wait for: Completed card -->
Add the loading, empty and error states to both screens exactly as prd.md §2 specifies.

Context: src/pages/Index.tsx and src/pages/Workspace.tsx (from 04) read real data. The copy for each state is in prd.md §2.1 (list: loading, error with Try again, empty "Pull your first framework out of your head", no match) and §2.2 (workspace: "Loading project…", not found "We couldn't open this framework" with "Back to frameworks"; chat: start card, "Getting your Creative Director ready…", the message-limit card at 300 turns; Framework tab "Nothing extracted yet"; Teaching plan "Teaching plan not started").

Build:
- Every state above with the exact copy. An empty list on a brand-new account is the correct result; do not seed data.
- Error states show the raw error message and a retry that re-runs the last action.

Done when: a new account's / shows the empty state, an unknown /framework/:id shows the not-found card, and a forced endpoint failure shows the chat error with Try again.

Change only src/pages/Index.tsx, src/pages/Workspace.tsx, src/components/framework/FrameworkChat.tsx, FrameworkTab.tsx and TeachingPlanTab.tsx. Do not touch: src/lib/framework/storage.ts (04), the endpoints (03b, 03c), src/lib/framework/prompts.ts (03a), the entity (02), src/index.css and src/components/ui/* (01).

Report: the diff per file and an explicit list of anything you did NOT do.
