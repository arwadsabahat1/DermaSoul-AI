import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/app/analyze", { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await register(email.trim(), password);
      toast.success("Studio ready—we signed you in.");
      navigate("/app/analyze", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
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
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-forest-900/35">
          Create sanctuary
        </p>
        <h1
          className="mt-3 text-3xl text-forest-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Claim your dermatology-aware studio
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
            Password (8+ chars)
            <input
              autoComplete="new-password"
              required
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 outline-none ring-forest-900/10 transition focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-forest-900/65">
            Confirm password
            <input
              autoComplete="new-password"
              required
              type="password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-3 outline-none ring-forest-900/10 transition focus:ring-2"
            />
          </label>
          <Button type="submit" className="w-full" loading={busy}>
            Create encrypted profile
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-forest-900/50">
          Already journaling?{" "}
          <Link to="/login" className="font-medium text-sage-700 hover:text-forest-900">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
