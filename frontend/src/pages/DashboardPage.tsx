import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GlassCard } from "../components/ui/GlassCard";
import { ConsultationPhoto } from "../components/ui/ConsultationPhoto";
import { fetchConsultations } from "../api/consultations";
import type { ConsultationListItem } from "../types/models";
import { getApiErrorMessage } from "../lib/errors";
import { riskStyles } from "../lib/risk";

export function DashboardPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchConsultations(5, 0);
        if (cancelled) return;
        setTotal(data.total);
        setRecent(data.items);
      } catch (e) {
        if (!cancelled) toast.error(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-forest-900/35">
            Home base
          </p>
          <h1
            className="mt-2 text-4xl text-forest-900 md:text-5xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Your skin story, gently quantified.
          </h1>
        </div>
        <Link
          to="/app/analyze"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-2xl bg-forest-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft backdrop-blur-sm transition hover:bg-forest-800 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          New studio session
        </Link>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <GlassCard className="md:col-span-1">
          <p className="text-sm text-forest-900/55">Consultations captured</p>
          <p className="mt-2 text-5xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            {loading ? "—" : total}
          </p>
          <Link to="/app/consultations" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:text-forest-900">
            View ledger <ArrowUpRight className="h-4 w-4" />
          </Link>
        </GlassCard>
        <GlassCard className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forest-900/55">Design note</p>
              <p className="mt-1 text-lg font-medium text-forest-900">
                Every artifact is explainable: confidences, rationales, OTC guardrails.
              </p>
            </div>
            <span className="hidden rounded-full bg-forest-900/5 px-4 py-2 text-xs uppercase tracking-widest text-forest-900/40 md:block">
              Trust mode
            </span>
          </div>
        </GlassCard>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-2xl text-forest-900"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Recent resonance
          </h2>
          <Link to="/app/consultations" className="text-sm font-medium text-sage-700 hover:text-forest-900">
            See everything
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {recent.length === 0 && !loading ? (
            <GlassCard>
              <p className="text-forest-900/60">Your first consult will appear here shortly.</p>
            </GlassCard>
          ) : (
            recent.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/app/consultations/${item.id}`} className="group block">
                  <GlassCard hover className="flex gap-4 overflow-hidden p-4">
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-forest-900/5 shadow-inner">
                      <ConsultationPhoto consultationId={item.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-lg font-medium text-forest-900">{item.predicted_disease}</p>
                      </div>
                      <p className="text-xs text-forest-900/45">
                        {(item.predicted_skin_type || "").toUpperCase()} •{" "}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskStyles(item.risk_level)}`}
                      >
                        {item.risk_level}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
