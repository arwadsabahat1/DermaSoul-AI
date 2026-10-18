import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -5, scale: 1.01, transition: { duration: 0.2 } } : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      className={`relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-card ${
        hover ? "cursor-pointer transition-shadow hover:shadow-lg" : ""
      } ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/35 to-transparent"
      />
      {children}
    </motion.div>
  );
}
