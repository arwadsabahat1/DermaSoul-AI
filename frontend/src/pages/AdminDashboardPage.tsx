import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, FileText, Users } from "lucide-react";
import { fetchAdminFlaggedConsultations, fetchAdminStats, type AdminFlaggedConsultation } from "../api/admin";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchAdminStats>> | null>(null);
  const [flagged, setFlagged] = useState<AdminFlaggedConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [s, f] = await Promise.all([fetchAdminStats(), fetchAdminFlaggedConsultations("High", 10)]);
        if (cancelled) return;
        setStats(s);
        setFlagged(f);
      } catch (e) {
        if (!cancelled) {
          const msg = getApiErrorMessage(e, "Could not load admin overview.");
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Total users", value: stats?.total_users ?? 0, icon: Users },
    { label: "Active users", value: stats?.active_users ?? 0, icon: Users },
    { label: "Total consultations", value: stats?.total_consultations ?? 0, icon: FileText },
    { label: "High-risk consultations", value: stats?.high_risk_consultations ?? 0, icon: AlertTriangle },
  ] as const;
  const riskBreakdown = Object.entries(stats?.consultations_by_risk ?? {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Admin overview"
        title="Operational snapshot"
        description="Live platform totals and recent high-risk signals to help you prioritize review."
      />
      {loadError ? <StateBanner tone="error">{loadError}</StateBanner> : null}
      {loading ? <p className="text-sm text-forest-900/55">Loading admin overview…</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-forest-900/40">{c.label}</p>
            <div className="mt-3 flex items-center gap-3">
              <c.icon className="h-5 w-5 text-teal-strong" />
              <p className="text-3xl font-semibold text-forest-900">{c.value}</p>
            </div>
            {loading ? <Skeleton className="mt-3 h-2 w-3/4" /> : null}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-5">
        <h2 className="text-lg font-semibold text-forest-900">Consultations by risk level</h2>
        <p className="mt-1 text-sm text-forest-900/60">
          Aggregate counts only; risk labels are automated triage signals, not clinical diagnoses.
        </p>
        {riskBreakdown.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {riskBreakdown.map(([risk, count]) => (
              <li key={risk} className="rounded-xl border border-card-border bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/55">{risk}</p>
                <p className="mt-1 text-2xl font-semibold text-forest-900">{count}</p>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label={`${risk} share of consultations`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats?.total_consultations
                    ? Math.round((count / stats.total_consultations) * 100)
                    : 0}
                >
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{
                      width: `${stats?.total_consultations
                        ? Math.min(100, (count / stats.total_consultations) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : !loading ? (
          <p className="mt-3 text-sm text-forest-900/60">No consultation data is available yet.</p>
        ) : null}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Recent high-risk consultations
          </h2>
          <Link to="/app/admin/users" className="text-sm font-semibold text-teal hover:text-teal-strong">
            Open user history →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {flagged.map((row) => (
            <div key={row.id} className="rounded-xl border border-card-border bg-white/65 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-forest-900">{row.predicted_disease}</p>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-900">
                  {row.risk_level}
                </span>
              </div>
              <p className="mt-1 text-xs text-forest-900/45">
                User {row.user_id} · {new Date(row.created_at).toLocaleString()}
              </p>
              <p className="mt-3 text-sm text-forest-900/72">{row.doctor_warning}</p>
            </div>
          ))}
          {!loading && flagged.length === 0 ? (
            <EmptyState
              title="No high-risk rows found"
              body="Recent consultations did not meet the current high-risk filter."
            />
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
