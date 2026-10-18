import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-card-border bg-gradient-to-b from-teal-deep to-teal-strong text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25 md:mx-0">
              <Leaf className="h-5 w-5 text-white" aria-hidden strokeWidth={1.75} />
            </div>
            <p className="text-xl font-bold tracking-tight">DermaSoul AI</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Educational skin analysis and curated guidance—not a replacement for licensed dermatology or emergency care.
            </p>
          </div>
          <nav className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-white/90 md:mt-2 md:justify-end">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/login" className="transition hover:text-white">
              Skin analysis
            </Link>
            <Link to="/conditions" className="transition hover:text-white">
              Conditions
            </Link>
            <Link to="/about" className="transition hover:text-white">
              About
            </Link>
          </nav>
        </div>
        <p className="mt-12 border-t border-white/15 pt-8 text-center text-xs text-white/50 md:text-left">
          Demo deployment — configure support contacts and privacy copy for your jurisdiction.
        </p>
      </div>
    </footer>
  );
}
