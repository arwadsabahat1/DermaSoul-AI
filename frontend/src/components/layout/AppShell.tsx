import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  Home,
  LogOut,
  Shield,
  Sparkles,
  Stethoscope,
  User2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../Logo";

type AppNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
};

function navClass(active: boolean): string {
  return `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
    active
      ? "bg-teal text-white shadow-card"
      : "text-forest-900/72 hover:bg-white/80 hover:text-forest-900"
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: AppNavItem[] = [
    { to: "/app/analyze", label: "Analyze", icon: Sparkles },
    { to: "/app/consultations", label: "History", icon: ClipboardList },
    { to: "/conditions", label: "Library", icon: BookOpen },
    { to: "/app/products", label: "OTC Shelf", icon: FlaskConical },
    { to: "/app/doctors", label: "Dermatologists", icon: Stethoscope },
    { to: "/app/profile", label: "Profile", icon: User2 },
  ];

  if (user?.role === "admin") {
    navItems.push({ to: "/app/admin/stats", label: "Admin", icon: Shield });
  }

  const mobileItems = [
    { to: "/app/analyze", label: "Analyze", icon: Sparkles },
    { to: "/app/consultations", label: "History", icon: ClipboardList },
    { to: "/conditions", label: "Library", icon: BookOpen },
    { to: "/app/profile", label: "Profile", icon: User2 },
  ] as const;

  const activeTitle =
    navItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
      ?.label ?? "DermaSoul";

  return (
    <div className="relative min-h-screen overflow-hidden bg-page font-sans text-slate-text md:h-dvh md:min-h-0">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-teal/[0.08] blur-3xl"
        animate={{ x: [0, 26, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-5rem] top-56 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
        animate={{ x: [0, -24, 0], y: [0, 16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <header className="sticky top-0 z-40 border-b border-card-border bg-white/80 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="DermaSoul AI home">
            <Logo variant="mark" size={32} />
            <span className="leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-teal-strong/55">
                DermaSoul
              </span>
              <span className="block text-base font-semibold text-forest-900">{activeTitle}</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-teal-strong ring-1 ring-card-border transition hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-4 md:h-full md:min-h-0 md:grid-cols-[250px_minmax(0,1fr)] md:items-stretch md:gap-8 md:px-6 md:py-6">
        <aside className="hidden min-h-0 flex-col rounded-3xl border border-card-border bg-white/75 p-4 shadow-card md:sticky md:top-6 md:flex md:h-full">
          <NavLink
            to="/"
            className="mb-4 flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white"
            aria-label="DermaSoul AI home"
          >
            <Logo variant="mark" size={40} />
            <span className="leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-teal-strong/55">
                DermaSoul
              </span>
              <span className="block text-lg font-semibold text-forest-900">Clinical Studio</span>
            </span>
          </NavLink>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <motion.div key={item.to} whileHover={{ x: 2 }} transition={{ duration: 0.16 }}>
                <NavLink to={item.to} className={({ isActive }) => navClass(isActive)}>
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-card-border bg-page px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-forest-900">{user?.email}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-forest-900/45">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-bold text-teal-strong ring-1 ring-card-border transition hover:bg-teal hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-0 min-w-0 pb-2 md:overflow-y-auto md:overscroll-contain md:pr-2"
        >
          <Outlet />
        </motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-white/92 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1">
          {mobileItems.map((item) => (
            <motion.div key={item.to} whileTap={{ scale: 0.96 }}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                    isActive ? "bg-teal text-white" : "text-forest-900/60"
                  }`
                }
              >
                <item.icon className="mb-1 h-4 w-4" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>
    </div>
  );
}
