type FormHintTone = "default" | "error";

export function FormHint({
  children,
  tone = "default",
  className = "",
}: {
  children: string;
  tone?: FormHintTone;
  className?: string;
}) {
  const toneClass = tone === "error" ? "text-red-800" : "text-forest-900/55";
  return <p className={`mt-1 text-xs leading-relaxed ${toneClass} ${className}`.trim()}>{children}</p>;
}
