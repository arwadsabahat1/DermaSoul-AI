import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen overflow-hidden flex-col bg-page font-sans text-slate-text">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-20 h-56 w-56 rounded-full bg-teal/[0.08] blur-3xl"
        animate={{ x: [0, 22, 0], y: [0, -12, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <SiteHeader mode="public" />
      <main className="flex w-full min-w-0 flex-1 flex-col">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <Outlet />
        </motion.div>
      </main>
      <SiteFooter />
    </div>
  );
}
