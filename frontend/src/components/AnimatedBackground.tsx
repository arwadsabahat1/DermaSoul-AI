import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream-100">
      <motion.div
        className="absolute -left-[20%] -top-[30%] h-[70vmin] w-[70vmin] rounded-full bg-gradient-to-br from-sage-400/35 via-transparent to-transparent blur-3xl"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[35%] -right-[25%] h-[85vmin] w-[85vmin] rounded-full bg-gradient-to-tl from-rose-200/40 via-transparent to-transparent blur-3xl"
        animate={{ scale: [1.05, 1, 1.05], rotate: [0, -6, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/2 h-[55vmin] w-[55vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sage-600/20 to-transparent blur-3xl"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(20 61 57 / 0.06) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
