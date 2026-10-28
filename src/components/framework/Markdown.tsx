import { Fragment } from "react";

/** Tiny markdown for chat bubbles: paragraphs, **bold**, `- ` and `1. ` lists. */
// ponytail: regex renderer; swap for react-markdown + remark-gfm if tables/links show up.
function inline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Fragment key={key}>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>))}
    </Fragment>
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed [&_strong]:font-semibold">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return <ul key={i} className="list-disc pl-5 space-y-1">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ""), j)}</li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return <ol key={i} className="list-decimal pl-5 space-y-1">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), j)}</li>)}</ol>;
        }
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l, j)}</Fragment>)}</p>;
      })}
    </div>
  );
}
export default Markdown;
