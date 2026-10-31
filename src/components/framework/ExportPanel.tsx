/**
 * Export tab: one file, the whole framework as Markdown (`{slug}-v1.md`), with
 * a live preview of exactly what downloads. Unconfirmed case studies get a
 * warning here and an "illustrative example" label in the file.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildFrameworkBriefMarkdown, frameworkName, slugify } from "@/lib/framework/brief";
import type { FrameworkProject } from "@/types";
import { evidenceOf } from "@/lib/framework/contract";
import { teachingDone } from "@/lib/framework/status";

export function ExportPanel({ project }: { project: FrameworkProject }) {
  const md = useMemo(() => buildFrameworkBriefMarkdown(project), [project]);
  // ponytail: projects are not versioned yet, so every file is v1. Bump when versions land.
  const file = `${slugify(frameworkName(project))}-v1.md`;
  const unconfirmed = project.state.teaching.steps.filter((s) => (s.case_study ?? "").trim() && evidenceOf(s, "case_study") !== "verified");

  const download = () => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" })), download: file });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success(`Saved ${file}`);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(md); toast.success("Copied. Paste it into Claude or ChatGPT."); } catch { toast.error("Could not copy. Download the file instead."); }
  };

  return (
    <div className="pt-2">
      {teachingDone(project.state) && (
        <figure className="relative mb-5 overflow-hidden rounded-2xl border border-border/60">
          <img src="/art/ready.webp" alt="" className="h-44 w-full object-cover object-[center_40%]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-4 pt-12">
            <p className="font-display text-lg font-semibold text-white">Your framework is ready.</p>
            <p className="text-sm text-white/75">Download it, then give it to your favorite AI to make anything from it.</p>
          </figcaption>
        </figure>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Give this file to Claude, ChatGPT or any AI and ask it for a website, PDF guide, emails or posts. <Link to="/tutorial#ai" className="text-primary hover:underline">See example prompts</Link></p>
          <p className="font-mono text-xs text-muted-foreground">{file}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9" onClick={() => void copy()}><Copy className="h-4 w-4" /> Copy</Button>
          <Button size="sm" className="h-9" onClick={download}><Download className="h-4 w-4" /> Download .md</Button>
        </div>
      </div>
      {unconfirmed.length > 0 && (
        <div role="note" className="mb-4 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>{unconfirmed.length} case {unconfirmed.length === 1 ? "study isn't" : "studies aren't"} confirmed as real ({unconfirmed.map((s) => s.name).join(", ")}). They export labelled "illustrative example". Confirm them in the Teaching plan before using this as marketing.</p>
        </div>
      )}
      <pre className="whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">
        {md.split("\n").map((line, i) => (
          <span key={i} className={/^#{1,3} /.test(line) ? "font-semibold text-primary" : line === "---" ? "text-muted-foreground" : undefined}>{line}{"\n"}</span>
        ))}
      </pre>
    </div>
  );
}
