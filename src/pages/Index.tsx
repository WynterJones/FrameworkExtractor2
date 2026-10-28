/**
 * SCREEN: / — Project list.
 *
 * Header: brand mark "Framework Extractor" (compass icon) left, avatar "J"
 * right, no nav. Hero (centred, primary glow): eyebrow pill "Your method,
 * named and teachable", h1 "Pull the framework out of your head.", one
 * paragraph, a large primary CTA "Start a new framework →" (creates a
 * project and opens it), small note "About 45 minutes. No prep, just answer
 * the questions." Then "Your frameworks N" + a search input, then the list.
 * Footer: brand + tagline on the left, copyright on the right; no links to
 * pages that do not exist. Hero card (centred text, no image): h1
 * "Framework Extractor", the pitch paragraph, a pill "N frameworks". Controls row:
 * primary "New Framework" button (plus icon, "Creating…" while busy) and a search
 * input ("Search frameworks…"). Then one row per framework_project: title,
 * "N steps mapped · Oct 28, 2026" (or "No steps yet"), a trash icon that swaps
 * the row for an inline confirm pane ("Delete this framework?" Cancel / Delete),
 * and a primary "Open →" button.
 *
 * Actions: New Framework → create a framework_project (title "Untitled
 * Framework", source "empty", setup copied from the most recent project when
 * complete, initial state) → navigate to /framework/:id. Delete → archived:
 * true (never a hard delete). Search filters by title on the client.
 *
 * States: loading ("Loading your frameworks…"), error (card + "Try again"),
 * empty ("Pull your first framework out of your head" + New Project),
 * no match ("No frameworks match “q”").
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Compass, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import AppBrand from "@/components/AppBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onEntityChange } from "@/lib/mock/entities";
import { createProject, deleteProject, listProjects } from "@/lib/framework/storage";
import type { FrameworkProject } from "@/lib/framework/contract";
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <AppBrand name="Framework Extractor" icon={<Compass className="h-5 w-5" />} />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold" aria-label="Jordan Lee">J</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-background px-6 py-14 text-center sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Your method, named and teachable</span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Pull the framework out of your head.</h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">A Creative Director interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.</p>
            <Button size="lg" className="mt-2 h-12 px-7 text-base active:scale-[0.98] transition-transform duration-150" onClick={() => void create()} disabled={creating}>
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Start a new framework <ArrowRight className="h-4 w-4" /></>}
            </Button>
            <p className="text-xs text-muted-foreground">About 45 minutes. No prep, just answer the questions.</p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">Your frameworks <span className="ml-1 text-sm font-normal text-muted-foreground tabular-nums">{projects.length}</span></h2>
          <label className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search frameworks…" aria-label="Search frameworks" className="pl-9" />
          </label>
        </div>

        <div className="mt-4">
          {loading ? (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="text-sm">Loading your frameworks…</span></div>
          ) : error ? (
            <div role="alert"><Empty title="Something went wrong" body={error} cta={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></div>
          ) : projects.length === 0 ? (
            <Empty title="No frameworks yet" body="Start one above and the Creative Director will interview you, then map your thinking into a framework you can teach and sell." />
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
                          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete framework — ${p.title}`} onClick={() => setPendingDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
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
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <AppBrand name="Framework Extractor" icon={<Compass className="h-5 w-5" />} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Pull the framework out of your head. Name it. Teach it. A Creative Director interview that turns what you already do into something you can sell.</p>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Framework Extractor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
