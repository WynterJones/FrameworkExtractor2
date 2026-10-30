/** SCREEN: /examples — curated starting points, always labelled Example and never mixed into the user's library. */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/mock/data";
import { PageHeader } from "./Index";

export default function Examples() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader title="Examples" sub="Start from one of these and make it yours. Your answers replace everything in it." />
        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <article key={t.id} className="flex flex-col rounded-2xl border border-dashed border-border bg-card/60 p-5">
              <span className="self-start rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Example</span>
              <h3 className="mt-3 font-display text-[15px] font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              <Button asChild variant="outline" size="sm" className="mt-4 h-9 self-start"><Link to={`?new=1&example=${t.id}`}>Start from this example <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
