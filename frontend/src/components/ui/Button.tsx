import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-teal text-white shadow-card hover:bg-teal-strong hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
  secondary:
    "bg-white/70 text-forest-900 ring-1 ring-forest-900/10 hover:bg-white hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
  ghost: "bg-transparent text-forest-900 hover:bg-forest-900/5 disabled:opacity-50",
  danger:
    "bg-red-900/90 text-white hover:bg-red-800 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
};

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  type = "button",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
}) {
  const isDisabled = Boolean(loading || disabled);

  return (
    <motion.span whileHover={isDisabled ? undefined : { y: -1 }} whileTap={isDisabled ? undefined : { scale: 0.985 }}>
      <button
        type={type}
        disabled={isDisabled}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-transform duration-200 ${styles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
            Working…
          </span>
        ) : (
          children
        )}
      </button>
    </motion.span>
  );
}
