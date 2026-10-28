import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Reads as plain text until hovered or focused; auto-grows; edits flow straight into project state. */
export function EditableText({ value, onChange, placeholder, ariaLabel, autoFocus, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel?: string; autoFocus?: boolean; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      spellCheck
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "block w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-relaxed text-foreground transition-colors",
        "hover:bg-foreground/5 focus:border-border focus:bg-foreground/[0.07] focus:outline-none placeholder:text-muted-foreground/60",
        className,
      )}
    />
  );
}
export default EditableText;
