import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Compass, Loader2, Plus, Search, Trash2 } from "lucide-react";
import AppBrand from "@/components/AppBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onEntityChange } from "@/lib/mock/entities";
import { createProject, deleteProject, listProjects } from "@/lib/framework/storage";
import type { FrameworkProject } from "@/lib/framework/types";
import "@/lib/mock/data";

const stepCount = (p: FrameworkProject) => p.state?.framework?.named_steps?.length || p.state?.framework?.raw_steps?.length || 0;
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function Index() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<FrameworkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setProjects(await listProjects()); } catch (e) { setError((e as Error).message || "Something went wrong."); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); return onEntityChange((n) => { if (n === "framework_project") void listProjects().then(setProjects); }); }, []);

  const create = async () => {
    setCreating(true);
    try { const p = await createProject(); navigate(`/framework/${p.id}`); } catch (e) { setError((e as Error).message); setCreating(false); }
  };
  const remove = async (id: string) => {
    setDeletingId(id);
    try { await deleteProject(id); setProjects((prev) => prev.filter((p) => p.id !== id)); setPendingDelete(null); } finally { setDeletingId(null); }
  };
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects; }, [projects, search]);

  const Empty = ({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) => (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-foreground/[0.02] px-6 py-14 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Boxes className="h-7 w-7" /></span>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <AppBrand name="Framework Extractor" icon={<Compass className="h-5 w-5" />} />
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link to="/" className="rounded-md px-3 py-1.5 font-medium text-foreground">Frameworks</Link>
          </nav>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold" aria-label="Jordan Lee">J</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-4 sm:p-6 md:flex-row-reverse md:items-center md:justify-between md:gap-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative hidden h-32 w-32 shrink-0 place-items-center md:grid md:h-36 md:w-36"><img src="/logo.jpg" alt="" aria-hidden className="h-full w-full rounded-3xl object-contain drop-shadow-xl" /></div>
          <div className="relative flex min-w-0 flex-1 flex-col items-start gap-3">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Framework Extractor</h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">You're already the expert — you just haven't packaged it yet. The Extractor interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline-flex"><span className="font-semibold text-foreground tabular-nums">{projects.length}</span>{projects.length === 1 ? "framework" : "frameworks"}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button onClick={() => void create()} disabled={creating} className="active:scale-[0.96] transition-transform duration-150">{creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : <><Plus className="h-3.5 w-3.5" /> New Project</>}</Button>
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" aria-label="Search projects" className="pl-9" />
          </label>
        </div>

        <div className="mt-5">
          {loading ? (
            <p role="status" aria-live="polite" className="my-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your frameworks…</p>
          ) : error ? (
            <div role="alert"><Empty title="Something went wrong" body={error} cta={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></div>
          ) : projects.length === 0 ? (
            <Empty title="Pull your first framework out of your head" body="Start a project and the Extractor will interview you, then map your thinking into a framework you can teach and sell." cta={<Button onClick={() => void create()} disabled={creating}>{creating ? "Creating…" : "New Project"}</Button>} />
          ) : filtered.length === 0 ? (
            <Empty title={`No frameworks match “${search.trim()}”`} body="Try a different search." />
          ) : (
            <ul className="space-y-2.5" aria-label="Framework projects">
              {filtered.map((p) => {
                const steps = stepCount(p);
                const confirming = pendingDelete === p.id;
                return (
                  <li key={p.id} className={`flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3.5 transition-colors ${confirming ? "border-destructive/40" : "border-border hover:border-primary/40"}`}>
                    {confirming ? (
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div><h4 className="text-sm font-bold">Delete this framework?</h4><p className="text-xs text-muted-foreground">“{p.title}” and everything extracted into it will be permanently removed. This can't be undone.</p></div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)} disabled={deletingId === p.id}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={() => void remove(p.id)} disabled={deletingId === p.id}>{deletingId === p.id ? "Deleting…" : "Delete"}</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link to={`/framework/${p.id}`} className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold">{p.title}</h3>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"><span className="tabular-nums">{steps > 0 ? `${steps} ${steps === 1 ? "step" : "steps"} mapped` : "No steps yet"}</span><span aria-hidden>·</span><span>{fmt(p.updated_at)}</span></p>
                        </Link>
                        <div className="flex items-center gap-2">
                          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete project — ${p.title}`} onClick={() => setPendingDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                          <Button asChild size="sm" className="active:scale-[0.96] transition-transform duration-150"><Link to={`/framework/${p.id}`}>Open <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
