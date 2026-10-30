/**
 * SCREEN: / — Home. Header "Your frameworks" + the product promise and a
 * "+ New framework" button. Populated: one Continue working card (the most
 * recent unfinished framework: stage, progress, last activity), then the
 * three most recent frameworks and "View all". Empty: three stages
 * (Tell your story → Shape the method → Put it to work), a primary CTA and a
 * link to the examples. Starting always opens the new-framework dialog (?new=1).
 */
import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Plus, Rocket, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContinueCard, FrameworkCard, useProjects } from "@/components/framework/Library";
import { libraryStatus } from "@/lib/framework/status";

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

const NewButton = () => <Button asChild className="h-10"><Link to="?new=1"><Plus className="h-4 w-4" /> New framework</Link></Button>;

export default function Index() {
  const all = useProjects();
  const projects = all?.filter((p) => !p.archived) ?? [];
  const resume = projects.find((p) => libraryStatus(p.state) !== "Ready");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader title="Your frameworks" sub="Turn what you know into a method you can teach, sell, and use everywhere."><NewButton /></PageHeader>

        {all === null ? (
          <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-card" />)}</div>
        ) : projects.length === 0 ? (
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
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11"><Link to="?new=1">Start your first framework <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="ghost" className="h-11"><Link to="/examples">See an example</Link></Button>
            </div>
          </section>
        ) : (
          <>
            {resume && <ContinueCard p={resume} />}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-[15px] font-semibold">Recent</h2>
                <Link to="/frameworks" className="text-sm text-muted-foreground hover:text-foreground">View all ({projects.length}) →</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 3).map((p) => <FrameworkCard key={p.id} p={p} />)}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
