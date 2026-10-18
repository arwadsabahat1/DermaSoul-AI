import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, Search, UserCog } from "lucide-react";
import {
  fetchAdminUserConsultations,
  fetchAdminUsers,
  setAdminUserStatus,
  type AdminUserSummary,
} from "../api/admin";
import type { ConsultationListItem } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";
import { riskStyles } from "../lib/risk";

const PAGE = 30;

export function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [history, setHistory] = useState<ConsultationListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setLoadError(null);
          const list = await fetchAdminUsers({ search: query.trim() || undefined, limit: PAGE, offset: 0 });
          if (!cancelled) setUsers(list);
        } catch (e) {
          if (!cancelled) {
            const msg = getApiErrorMessage(e, "Could not load users.");
            setLoadError(msg);
            toast.error(msg);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function toggleStatus(user: AdminUserSummary) {
    setSavingId(user.id);
    try {
      const updated = await setAdminUserStatus(user.id, !user.is_active);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: updated.is_active } : u)));
      if (selectedUser?.id === user.id) setSelectedUser((prev) => (prev ? { ...prev, is_active: updated.is_active } : prev));
      toast.success(`User ${updated.is_active ? "enabled" : "disabled"}.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSavingId(null);
    }
  }

  async function openHistory(user: AdminUserSummary) {
    setSelectedUser(user);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const res = await fetchAdminUserConsultations(user.id, 100, 0);
      setHistory(res.items);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not load user consultation history."));
    } finally {
      setHistoryLoading(false);
    }
  }

  const selectedSummary = useMemo(() => {
    if (!selectedUser) return null;
    return users.find((u) => u.id === selectedUser.id) ?? selectedUser;
  }, [selectedUser, users]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-teal-strong" />
          <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            User management
          </h2>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-900/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email…"
            className="w-full rounded-xl border border-card-border bg-page py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal/45"
          />
        </div>
        {loadError ? <StateBanner tone="error" className="mt-4">{loadError}</StateBanner> : null}
        <div className="mt-4 space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            : null}
          {users.map((u) => (
            <div key={u.id} className="rounded-xl border border-card-border bg-white/65 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-forest-900">{u.email}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    u.is_active ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
                  }`}
                >
                  {u.is_active ? "active" : "disabled"}
                </span>
              </div>
              <p className="mt-1 text-xs text-forest-900/45">
                {u.role} · created {new Date(u.created_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => void openHistory(u)}>
                  View history
                </Button>
                <Button
                  variant={u.is_active ? "danger" : "primary"}
                  className="px-3 py-2 text-xs"
                  loading={savingId === u.id}
                  onClick={() => void toggleStatus(u)}
                >
                  {u.is_active ? "Disable user" : "Enable user"}
                </Button>
              </div>
            </div>
          ))}
          {loading ? <p className="text-sm text-forest-900/55">Loading users…</p> : null}
          {!loading && users.length === 0 ? <EmptyState title="No users found" body="Try another email query." /> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-teal-strong" />
          <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            User consultation history
          </h2>
        </div>
        {selectedSummary ? (
          <p className="mt-2 text-sm text-forest-900/65">
            {selectedSummary.email} · {selectedSummary.is_active ? "active" : "disabled"}
          </p>
        ) : (
          <p className="mt-2 text-sm text-forest-900/55">Select a user to inspect their analysis history.</p>
        )}
        <div className="mt-4 space-y-2">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl border border-card-border bg-white/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-forest-900">{item.predicted_disease}</p>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${riskStyles(item.risk_level)}`}>
                  {item.risk_level}
                </span>
              </div>
              <p className="mt-1 text-xs text-forest-900/45">
                {new Date(item.created_at).toLocaleString()} · {item.predicted_skin_type}
              </p>
            </div>
          ))}
          {historyLoading ? <p className="text-sm text-forest-900/55">Loading consultation history…</p> : null}
          {!historyLoading && selectedSummary && history.length === 0 ? (
            <EmptyState title="No consultations for this user" />
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
