import { Component, type ErrorInfo, type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DermaSoul UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md rounded-3xl border border-forest-900/10 bg-white/80 p-10 text-center shadow-soft backdrop-blur-xl"
          >
            <p
              className="text-2xl text-forest-900"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
            >
              Something went off course
            </p>
            <p className="mt-3 text-sm leading-relaxed text-forest-800/70">
              The app is still safe—this screen caught an unexpected error so the rest of your session
              does not break. Refresh the page or return home.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="mt-8 w-full rounded-2xl bg-forest-900 py-3 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-forest-800"
            >
              Back home
            </button>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}
