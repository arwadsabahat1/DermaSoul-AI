import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="relative h-16 w-16"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-sage-400/30" />
          <div className="absolute inset-0 rounded-full border-2 border-t-forest-900 border-transparent" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="text-sm tracking-wide text-forest-900/55"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
        >
          Preparing your space…
        </motion.p>
      </div>
    </div>
  );
}
