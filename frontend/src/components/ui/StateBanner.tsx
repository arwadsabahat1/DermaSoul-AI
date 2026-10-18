import type { ReactNode } from "react";

type Tone = "info" | "success" | "error";

const toneClasses: Record<Tone, string> = {
  info: "border-teal/20 bg-teal/[0.06] text-teal-deep",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function StateBanner({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClasses[tone]} ${className}`.trim()}>{children}</div>;
}
