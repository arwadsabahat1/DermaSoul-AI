import { NavLink, Outlet } from "react-router-dom";
import { Shield } from "lucide-react";

const LINKS = [
  { to: "/app/admin/stats", label: "Overview" },
  { to: "/app/admin/users", label: "Users & History" },
  { to: "/app/admin/products", label: "OTC Shelf" },
  { to: "/app/admin/dermatologists", label: "Dermatologists" },
  { to: "/app/admin/education", label: "Disease Library" },
] as const;

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-card-border bg-gradient-to-br from-teal/[0.08] via-card to-card p-5 shadow-card md:p-7">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-teal-strong" />
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-strong/70">Admin Studio</p>
        </div>
        <h1 className="mt-3 text-3xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Platform operations and governance
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-forest-900/65">
          Manage users, review high-risk consultations, maintain OTC shelf entries, curate dermatologist referrals, and update disease-library content.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2">
          {LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-teal text-white shadow-card" : "bg-white/60 text-forest-900/70 hover:bg-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </section>
      <Outlet />
    </div>
  );
}
