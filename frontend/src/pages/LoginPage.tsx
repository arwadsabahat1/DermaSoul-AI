import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Button } from "../components/ui/Button";
import { Logo } from "../components/Logo";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app/analyze";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [authLoading, user, from, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back.");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen px-4 py-14 font-sans text-forest-900">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/35 bg-white/60 p-10 shadow-soft backdrop-blur-2xl"
      >
        <div className="mb-6 flex justify-center">
          <Logo variant="mark" size={64} />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.4em] text-forest-900/35">
          Returning visitor
        </p>
        <h1
          className="mt-3 text-center text-3xl text-forest-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Welcome back to DermaSoul
        </h1>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-forest-900/65">
            Email
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-forest-900 outline-none ring-forest-900/10 transition focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-forest-900/65">
            Password
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-forest-900 outline-none ring-forest-900/10 transition focus:ring-2"
            />
          </label>
          <Button type="submit" className="w-full" loading={busy}>
            Sign in securely
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-forest-900/50">
          New here?{" "}
          <Link to="/register" className="font-medium text-sage-700 hover:text-forest-900">
            Start an account
          </Link>
        </p>
        <Link
          to="/"
          className="mt-6 block text-center text-xs text-forest-900/40 hover:text-forest-900/70"
        >
          ← Studio home
        </Link>
      </motion.div>
    </div>
  );
}
