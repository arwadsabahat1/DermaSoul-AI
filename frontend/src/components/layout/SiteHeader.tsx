import { type FormEvent, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Search, Sparkles, User2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../Logo";

type Mode = "public" | "app";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  state?: { from: string };
  activePath?: string;
};

const PUBLIC_LINKS: NavItem[] = [
  { to: "/", label: "Home", end: true },
  { to: "/login", label: "Skin Analysis", state: { from: "/app/analyze" }, activePath: "/app/analyze" },
  { to: "/conditions", label: "Conditions" },
  { to: "/about", label: "About" },
];

const APP_LINKS_BASE: NavItem[] = [
  { to: "/", label: "Home", end: true },
  { to: "/app/analyze", label: "Skin Analysis", activePath: "/app/analyze" },
  { to: "/conditions", label: "Conditions" },
  { to: "/about", label: "About" },
  { to: "/app/consultations", label: "History", activePath: "/app/consultations" },
  { to: "/app/profile", label: "Profile", activePath: "/app/profile" },
  { to: "/app/products", label: "OTC Shelf", activePath: "/app/products" },
];

function LogoWordmark() {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2.5 text-white"
      aria-label="DermaSoul AI home"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 transition group-hover:bg-white/18">
        <Logo variant="mark" size={28} title="DermaSoul AI" />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight">
          Derma<span className="text-white/90">Soul</span>
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.35em] text-white/78">
          AI Dermatology
        </span>
      </span>
    </Link>
  );
}

function linkClass(active: boolean) {
  return `rounded-xl px-3 py-2 text-sm font-semibold tracking-tight transition whitespace-nowrap ${
    active ? "bg-teal-soft text-white shadow-inner" : "text-white/88 hover:bg-white/10 hover:text-white"
  }`;
}

export function SiteHeader({ mode }: { mode: Mode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const pathname = location.pathname.replace(/\/$/, "") || "/";

  const appLinks = user?.role === "admin"
    ? [...APP_LINKS_BASE, { to: "/app/admin/stats", label: "Admin", activePath: "/app/admin" }]
    : APP_LINKS_BASE;
  const links = mode === "app" ? appLinks : PUBLIC_LINKS;

  function runSearch() {
    const trimmed = q.trim();
    const path = trimmed ? `/conditions?search=${encodeURIComponent(trimmed)}` : "/conditions";
    navigate(path);
    setMobileOpen(false);
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    runSearch();
  }

  function isItemActive(pathname: string, item: NavItem): boolean {
    if (item.activePath) {
      return pathname === item.activePath || pathname.startsWith(`${item.activePath}/`);
    }
    if (item.end) {
      return pathname === item.to;
    }
    if (item.to === "/") {
      return pathname === "/";
    }
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  }

  return (
    <header className="sticky top-0 z-50 shadow-header">
      <div className="bg-teal">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 lg:gap-4">
          <LogoWordmark />

          <nav className="scrollbar-none order-4 hidden flex-1 items-center justify-center gap-0.5 overflow-x-auto xl:order-none xl:flex">
            {links.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={Boolean(item.end)}
                state={item.state}
                className={() => linkClass(isItemActive(pathname, item))}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="order-2 hidden min-w-[200px] flex-1 xl:order-none xl:flex lg:max-w-md"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-soft" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search conditions, symptoms…"
                className="placeholder:text-white/42 w-full rounded-full border border-white/28 bg-teal-muted py-2.5 pl-10 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-sm focus:border-white/48 focus:bg-teal-soft/95"
              />
            </div>
          </form>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            {mode === "app" ? (
              <div className="hidden items-center gap-2 sm:flex sm:gap-3">
                <span className="flex max-w-[10rem] items-center gap-1.5 truncate text-sm font-semibold text-white lg:max-w-[12rem]">
                  <User2 className="h-4 w-4 shrink-0 opacity-95" aria-hidden />{" "}
                  <span className="truncate">{user?.email?.split("@")[0] ?? "Studio"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/", { replace: true });
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-strong shadow-md ring-2 ring-transparent hover:ring-white/95"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            ) : user ? (
              <Link
                to="/app/analyze"
                className="hidden items-center gap-2 rounded-xl bg-teal-soft px-4 py-2 text-sm font-bold text-white ring-2 ring-white/15 sm:flex"
              >
                <Sparkles className="h-4 w-4" /> Open studio
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-xl bg-white px-5 py-2 text-sm font-bold text-teal-strong shadow-md ring-2 ring-transparent hover:ring-white sm:flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="flex rounded-xl border border-white/40 bg-teal-muted p-2.5 text-white xl:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden overflow-hidden border-t border-white/12 bg-teal-strong"
            >
              <nav className="flex flex-col gap-0.5 px-3 pb-4 pt-1">
                {links.map((item) => (
                  <NavLink
                    key={`m-${item.label}`}
                    to={item.to}
                    end={Boolean(item.end)}
                    state={item.state}
                    onClick={() => setMobileOpen(false)}
                    className={() => `${linkClass(isItemActive(pathname, item))} px-3 py-3`}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <form onSubmit={(e) => void onSubmit(e)} className="relative mt-2 px-1">
                  <Search className="absolute left-4 top-2.5 h-4 w-4 text-white/45" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-full border border-white/25 bg-teal-muted py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/42"
                  />
                </form>
                {mode === "app" ? (
                  <div className="mt-3 border-t border-white/12 px-3 py-4 text-white">
                    <p className="truncate text-sm opacity-90">{user?.email}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                        navigate("/", { replace: true });
                      }}
                      className="mt-3 w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-teal-strong"
                    >
                      Log out
                    </button>
                  </div>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="mx-3 mt-3 block rounded-xl bg-white py-3 text-center text-sm font-bold text-teal-strong"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                ) : (
                  <Link
                    to="/app/analyze"
                    className="mx-3 mt-3 block rounded-xl bg-teal-soft py-3 text-center text-sm font-bold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Open studio
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
