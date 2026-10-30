/** CRUD for the `framework_project` entity. On OverSkill only the import of `overskill` changes. */
import { overskill } from "@/lib/auth";
import { initialFrameworkState, provisionalTitle, type FrameworkProject, type FrameworkSetup } from "./contract";

const table = () => overskill.entities.framework_project;

export const listProjects = () => table().list("-updated_at") as Promise<FrameworkProject[]>;
export const getProject = (id: string) => table().get(id) as Promise<FrameworkProject | null>;

/** Create a project with the setup picked in the dashboard composer. */
export function createProject(setup: FrameworkSetup, source: FrameworkProject["source"] = "empty", title = provisionalTitle()): Promise<FrameworkProject> {
  return table().create({ title, source, setup, state: initialFrameworkState(), archived: false }) as Promise<FrameworkProject>;
}

/** The most recent complete setup, to pre-fill the composer. */
export async function lastSetup(): Promise<FrameworkSetup> {
  const [prior] = await listProjects();
  const s = prior?.setup;
  return s?.character_id && s.voice_id && s.customer_avatar_id ? s : {};
}

export const updateProject = (id: string, patch: Partial<Pick<FrameworkProject, "title" | "source" | "setup" | "state" | "archived">>) =>
  table().update(id, patch) as Promise<FrameworkProject>;

// ponytail: hard delete, matching the prototype. The PRD asks OverSkill for an `archived` flag instead.
export const deleteProject = (id: string) => table().delete(id);

export async function duplicateProject(p: FrameworkProject): Promise<FrameworkProject> {
  return table().create({ title: `${p.title} (copy)`, source: p.source, setup: p.setup, state: p.state, archived: false }) as Promise<FrameworkProject>;
}
