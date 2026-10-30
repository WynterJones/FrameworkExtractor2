/**
 * SCREEN: / — Home. One job: start a framework, or pick up the one in
 * progress. The frameworks themselves live in the sidebar. h1 "Pull the
 * framework out of your head." + the product promise and "+ New framework";
 * then the Continue working card for the latest unfinished framework, or,
 * with none, three stages (Tell your story → Shape the method → Put it to
 * work). Starting opens the new-framework dialog (?new=1), which also holds
 * the examples.
 */
import { Link } from "react-router-dom";
import { MessageSquare, Plus, Rocket, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContinueCard, useProjects } from "@/components/framework/Library";
import { libraryStatus } from "@/lib/framework/status";

const STEPS = [[MessageSquare, "Tell your story", "Talk through what you do and how you learned it."], [Shapes, "Shape the method", "Name the steps and the framework."], [Rocket, "Put it to work", "Teach it, sell it, export it."]] as const;

export default function Index() {
  const all = useProjects();
  const resume = all?.find((p) => !p.archived && libraryStatus(p.state) !== "Ready");

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 px-4 py-10 sm:px-8">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Pull the framework out of your head.</h1>
          <p className="mt-2 text-muted-foreground">Turn what you know into a method you can teach, sell, and use everywhere.</p>
          <Button asChild size="lg" className="mt-6 h-11"><Link to="?new=1"><Plus className="h-4 w-4" /> New framework</Link></Button>
        </header>
        {all === null ? null : resume ? <ContinueCard p={resume} /> : (
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(([Icon, t, d], i) => (
              <li key={t} className="rounded-2xl border border-border/60 bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{i + 1}. {t}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
