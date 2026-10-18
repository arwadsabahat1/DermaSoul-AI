import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  actions,
}: {
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-card-border bg-white/70 p-6 text-center shadow-card md:p-8">
      <p className="text-lg font-semibold text-forest-900">{title}</p>
      {body ? <p className="mt-2 text-sm leading-relaxed text-forest-900/62">{body}</p> : null}
      {actions ? <div className="mt-5">{actions}</div> : null}
    </div>
  );
}
