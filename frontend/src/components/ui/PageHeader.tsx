import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 ${className}`.trim()}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-forest-900/35">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl text-forest-900 md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-forest-900/62">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
