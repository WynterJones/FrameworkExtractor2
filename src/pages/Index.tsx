/**
 * SCREEN: / — Home, the only library page (most people extract one to three
 * frameworks). Header "Your frameworks" + the product promise and
 * "+ New framework". Populated: a Continue working card (the most recent
 * unfinished framework) over every framework as a card. Search, sort and
 * status filters appear only past six frameworks; archived ones sit behind a
 * "Show archived (N)" link. Empty: three stages (Tell your story → Shape the
 * method → Put it to work) and a CTA. Starting opens the new-framework dialog
 * (?new=1), which also holds the examples.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Plus, Rocket, Search, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContinueCard, displayTitle, FrameworkCard, promise, useProjects } from "@/components/framework/Library";
import { libraryStatus, progress } from "@/lib/framework/status";

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

const FILTERS = ["All", "Discovering", "Needs review", "Teaching in progress", "Ready"] as const;
type Sort = "updated" | "name" | "progress";
/** Below this many frameworks the controls are noise. */
const CONTROLS_FROM = 7;

export default function Index() {
  const all = useProjects();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [sort, setSort] = useState<Sort>("updated");
  const [showArchived, setShowArchived] = useState(false);
  const active = all?.filter((p) => !p.archived) ?? [];
  const archived = all?.filter((p) => p.archived) ?? [];
  const resume = active.find((p) => libraryStatus(p.state) !== "Ready");
  const controls = active.length >= CONTROLS_FROM;
  const list = (showArchived ? archived : active)
    .filter((p) => !controls || filter === "All" || libraryStatus(p.state) === filter)
    .filter((p) => !controls || `${displayTitle(p)} ${promise(p)}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => sort === "name" ? displayTitle(a).localeCompare(displayTitle(b)) : sort === "progress" ? progress(b.state) - progress(a.state) : b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader title="Your frameworks" sub="Turn what you know into a method you can teach, sell, and use everywhere.">
          <Button asChild className="h-10"><Link to="?new=1"><Plus className="h-4 w-4" /> New framework</Link></Button>
        </PageHeader>

        {all === null ? (
          <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-card" />)}</div>
        ) : active.length === 0 && !showArchived ? (
          <section className="rounded-3xl border border-border/70 bg-card p-6 text-center sm:p-10">
            <h2 className="font-display text-xl font-semibold">Pull the framework out of your head</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Answer a few questions. We shape your answers into named steps you can teach.</p>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {([[MessageSquare, "Tell your story", "Talk through what you do and how you learned it."], [Shapes, "Shape the method", "Name the steps and the framework."], [Rocket, "Put it to work", "Teach it, sell it, export it."]] as const).map(([Icon, t, d], i) => (
                <li key={t} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{i + 1}. {t}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
            <Button asChild size="lg" className="mt-8 h-11"><Link to="?new=1">Start your first framework <ArrowRight className="h-4 w-4" /></Link></Button>
            {archived.length > 0 && <button type="button" onClick={() => setShowArchived(true)} className="mt-4 block w-full text-xs text-muted-foreground hover:text-foreground">Show archived ({archived.length})</button>}
          </section>
        ) : (
          <>
            {resume && !showArchived && <ContinueCard p={resume} />}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-[15px] font-semibold">{showArchived ? "Archived" : "All frameworks"}</h2>
                {archived.length > 0 && <button type="button" onClick={() => setShowArchived((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground">{showArchived ? "Back to frameworks" : `Show archived (${archived.length})`}</button>}
              </div>
              {controls && !showArchived && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search frameworks" aria-label="Search frameworks" className="h-9 pl-9" />
                    </div>
                    <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                      <SelectTrigger className="h-9 w-40" aria-label="Sort"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="updated">Last updated</SelectItem><SelectItem value="name">Name</SelectItem><SelectItem value="progress">Progress</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
                    {FILTERS.map((f) => (
                      <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${filter === f ? "border-primary/50 bg-primary/15 font-medium text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
                    ))}
                  </div>
                </div>
              )}
              {list.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <FrameworkCard key={p.id} p={p} />)}</div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">Nothing matches. Try another filter or search.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
