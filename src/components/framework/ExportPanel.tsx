/**
 * Export tab: a scope (Framework only / Teaching guide / Complete kit) and a
 * format (Markdown, PDF, PowerPoint). Below, a live preview of exactly what
 * downloads, named `{slug}-{scope}-v1.{ext}`. Status is honest: Working… while
 * the file builds, Saved only after it did, a retry on failure. Unconfirmed case
 * studies get a warning here and an "illustrative example" label in the file.
 *   Markdown: the .md source in a monospace pane (headings and bold tinted).
 *   PDF: the printable brief rendered in an iframe as white paper; Download
 *   calls the iframe's print dialog (Save as PDF).
 *   PowerPoint: the slide list as 16:9 thumbnails; Download builds the .pptx
 *   client-side with pptxgenjs.
 */
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Download, FileText, FileType2, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildFrameworkBriefMarkdown } from "@/lib/framework/brief";
import { buildBriefHtml, buildSlides, downloadMarkdown, downloadPptx, exportFileName, scoped, SCOPES, type ExportScope } from "@/lib/framework/export";
import type { FrameworkProject } from "@/types";

type Format = "markdown" | "pdf" | "pptx";

const FORMATS: { id: Format; label: string; ext: string; Icon: typeof FileText; blurb: string }[] = [
  { id: "markdown", label: "Markdown", ext: ".md", Icon: FileText, blurb: "Plain text with headings. Paste it into Notion, a doc, or a prompt." },
  { id: "pdf", label: "PDF", ext: ".pdf", Icon: FileType2, blurb: "A clean printed brief to hand to a client or keep on file." },
  { id: "pptx", label: "PowerPoint", ext: ".pptx", Icon: Presentation, blurb: "A 16:9 deck, one slide per step and component. Opens in Keynote and Slides too." },
];

export function ExportPanel({ project }: { project: FrameworkProject }) {
  const [format, setFormat] = useState<Format>("markdown");
  const [scope, setScope] = useState<ExportScope>("teaching");
  const [status, setStatus] = useState<{ kind: "working" | "done" | "failed"; msg: string } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const p = useMemo(() => scoped(project, scope), [project, scope]);
  const md = useMemo(() => buildFrameworkBriefMarkdown(p), [p]);
  const html = useMemo(() => buildBriefHtml(p), [p]);
  const slides = useMemo(() => buildSlides(p), [p]);
  const current = FORMATS.find((f) => f.id === format)!;
  const file = exportFileName(project, scope, current.ext.slice(1));
  const unconfirmed = scope === "framework" ? [] : p.state.teaching.steps.filter((s) => (s.case_study ?? "").trim() && !s.verified?.includes("case_study"));

  const download = async () => {
    setStatus({ kind: "working", msg: `Building ${file}…` });
    try {
      if (format === "markdown") downloadMarkdown(p, file);
      else if (format === "pdf") {
        const w = frame.current?.contentWindow;
        if (!w) throw new Error("The preview has not loaded yet.");
        w.focus(); w.print();
        setStatus({ kind: "done", msg: 'Print dialog opened. Choose "Save as PDF".' });
        return;
      } else await downloadPptx(p, file);
      setStatus({ kind: "done", msg: `Saved ${file}` });
      toast.success(`Saved ${file}`);
    } catch (e) {
      setStatus({ kind: "failed", msg: `Export failed: ${(e as Error).message}` });
    }
  };

  return (
    <div className="pt-2">
      <div role="group" aria-label="Export scope" className="mb-3 grid gap-2 sm:grid-cols-3">
        {SCOPES.map((sc) => (
          <button key={sc.id} type="button" aria-pressed={scope === sc.id} onClick={() => { setScope(sc.id); setStatus(null); }} className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${scope === sc.id ? "border-primary/50 bg-primary/[0.08]" : "border-border/60 bg-background/40 hover:border-border"}`}>
            <span className="block text-sm font-semibold">{sc.label}</span>
            <span className="block text-xs text-muted-foreground">{sc.blurb}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Export format" className="inline-flex gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
          {FORMATS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={format === id} onClick={() => { setFormat(id); setStatus(null); }} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${format === id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <Icon className={`h-3.5 w-3.5 ${format === id ? "text-primary" : ""}`} />{label}
            </button>
          ))}
        </nav>
        <Button size="sm" className="h-9" onClick={() => void download()} disabled={status?.kind === "working"}>
          {status?.kind === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download {current.ext}
        </Button>
      </div>
      <p className="mb-2 text-sm text-muted-foreground">{current.blurb}</p>
      <p className="mb-4 font-mono text-xs text-muted-foreground">{file}</p>
      {status && (
        <p role="status" className={`mb-4 inline-flex items-center gap-2 text-sm ${status.kind === "failed" ? "text-destructive" : status.kind === "done" ? "text-emerald-400" : "text-muted-foreground"}`}>
          {status.kind === "working" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status.kind === "done" ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{status.msg}
          {status.kind === "failed" && <button type="button" className="underline" onClick={() => void download()}>Try again</button>}
        </p>
      )}
      {unconfirmed.length > 0 && (
        <div role="note" className="mb-4 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>{unconfirmed.length} case {unconfirmed.length === 1 ? "study isn't" : "studies aren't"} confirmed as real ({unconfirmed.map((s) => s.name).join(", ")}). They export labelled "illustrative example". Confirm them in the Teaching plan before using this as marketing.</p>
        </div>
      )}

      {format === "markdown" && (
        <pre className="whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">
          {md.split("\n").map((line, i) => (
            <span key={i} className={/^#{1,3} /.test(line) ? "font-semibold text-primary" : line === "---" ? "text-muted-foreground" : undefined}>{line}{"\n"}</span>
          ))}
        </pre>
      )}
      {format === "pdf" && (
        <iframe ref={frame} title="PDF preview" srcDoc={html} className="h-[75vh] w-full rounded-xl border border-border/60 bg-[#e9e9e9]" />
      )}
      {format === "pptx" && (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slides.map((s, i) => (
            <li key={i} className={`relative flex aspect-video flex-col overflow-hidden rounded-lg border p-4 shadow-sm ${i === 0 ? "border-white/10 bg-[#141414] text-white" : "border-black/10 bg-white text-[#1a1a1a]"}`}>
              {s.kicker && <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{s.kicker}</p>}
              <h4 className={`font-display font-bold leading-tight ${i === 0 ? "text-lg" : "text-[15px]"}`}>{s.title}</h4>
              {s.body && <p className={`mt-1.5 line-clamp-4 text-[10.5px] leading-snug ${i === 0 ? "text-white/60" : "text-[#444]"}`}>{s.body}</p>}
              {s.bullets && <ol className="mt-1.5 list-decimal pl-4 text-[10.5px] leading-snug text-[#444]">{s.bullets.map((b, n) => <li key={n}>{b}</li>)}</ol>}
              <span className={`absolute bottom-2 right-3 text-[8px] ${i === 0 ? "text-white/40" : "text-black/35"}`}>{i + 1}/{slides.length}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
