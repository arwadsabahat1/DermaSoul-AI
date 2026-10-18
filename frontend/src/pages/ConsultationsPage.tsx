import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, GitCompareArrows, LayoutGrid, Sparkles, X } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { ConsultationPhoto } from "../components/ui/ConsultationPhoto";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { fetchConsultation, fetchConsultations } from "../api/consultations";
import type { ConsultationDetail, ConsultationListItem } from "../types/models";
import { getApiErrorMessage } from "../lib/errors";
import { riskStyles } from "../lib/risk";

const PAGE = 12;
const TIMELINE_PAGE = 30;

type ViewMode = "grid" | "timeline";

export function ConsultationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareRecords, setCompareRecords] = useState<ConsultationDetail[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const limit = viewMode === "grid" ? PAGE : TIMELINE_PAGE;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchConsultations(limit, offset);
        if (cancelled) return;
        const append = viewMode === "timeline" && offset > 0;
        if (!append) setItems(data.items);
        else setItems((prev) => [...prev, ...data.items]);
        setTotal(data.total);
      } catch (e) {
        if (!cancelled) {
          const msg = getApiErrorMessage(e);
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
  }, [limit, offset, viewMode]);

  useEffect(() => {
    if (compareIds.length !== 2) {
      setCompareRecords([]);
      setCompareError(null);
      setCompareLoading(false);
      return;
    }

    let cancelled = false;
    setCompareLoading(true);
    setCompareError(null);
    void Promise.all(compareIds.map((id) => fetchConsultation(id)))
      .then((records) => {
        if (!cancelled) setCompareRecords(records);
      })
      .catch((error) => {
        if (!cancelled) {
          setCompareRecords([]);
          setCompareError(getApiErrorMessage(error, "Could not load both consultations for comparison."));
        }
      })
      .finally(() => {
        if (!cancelled) setCompareLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [compareIds]);

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((selected) => selected !== id);
      if (current.length >= 2) {
        toast("Choose up to two consultations. Remove one selection first.");
        return current;
      }
      return [...current, id];
    });
  }

  function toggleCompareMode() {
    setCompareMode((enabled) => !enabled);
    setCompareIds([]);
  }

  function switchView(mode: ViewMode) {
    if (mode === viewMode) return;
    setViewMode(mode);
    setOffset(0);
    setItems([]);
  }

  const sortedTimeline = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [items]);

  const pageIndex = Math.floor(offset / PAGE);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const canLoadMoreTimeline = items.length < total && viewMode === "timeline";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Consultation ledger"
        title="Everything we’ve reflected on together"
        description="Switch between timeline and grid views. Timeline emphasizes progression over time; grid is best for quick scanning."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-forest-900/55">
          {loading && items.length === 0 ? (
            "Fetching…"
          ) : viewMode === "grid" ? (
            `${total} consultations stored securely.`
          ) : (
            `${sortedTimeline.length} shown · ${total} total · newest on the left`
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleCompareMode}
            aria-pressed={compareMode}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
              compareMode ? "border-teal bg-teal text-white" : "border-card-border bg-white/70 text-forest-900/70 hover:bg-white"
            }`}
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            {compareMode ? "Exit compare" : "Compare"}
          </button>
          <div className="inline-flex rounded-2xl border border-white/40 bg-white/50 p-1">
            <button
              type="button"
              onClick={() => switchView("timeline")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                viewMode === "timeline" ? "bg-teal text-white shadow-card" : "text-forest-900/65 hover:bg-white"
              }`}
              aria-pressed={viewMode === "timeline"}
            >
              <Sparkles className="h-4 w-4 shrink-0" /> Timeline
            </button>
            <button
              type="button"
              onClick={() => switchView("grid")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                viewMode === "grid" ? "bg-teal text-white shadow-card" : "text-forest-900/65 hover:bg-white"
              }`}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" /> Grid
            </button>
          </div>
          {viewMode === "grid" ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/50 p-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={offset <= 0}
                onClick={() => setOffset((v) => Math.max(0, v - PAGE))}
                className="rounded-xl p-2 hover:bg-white disabled:opacity-35"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-2 text-sm text-forest-900/70">
                Page {pageIndex + 1} / {pages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={offset + PAGE >= total}
                onClick={() => setOffset((v) => v + PAGE)}
                className="rounded-xl p-2 hover:bg-white disabled:opacity-35"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {loadError ? <StateBanner tone="error">{loadError}</StateBanner> : null}

      {compareMode ? (
        <StateBanner tone="info">
          Select two consultations to compare their saved details. Changes in model predictions or triage labels do not
          establish that a condition has improved or worsened.
          <span className="ml-2 font-semibold">{compareIds.length}/2 selected</span>
        </StateBanner>
      ) : null}

      {loading && items.length === 0 ? (
        <GlassCard className="space-y-3 p-4 md:p-6">
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </GlassCard>
      ) : null}

      {viewMode === "timeline" ? (
        <GlassCard className="relative overflow-hidden p-4 md:p-6">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-forest-900/38">History strip</p>
          {sortedTimeline.length === 0 && loading ? (
            <p className="text-forest-900/55">Loading your timeline…</p>
          ) : sortedTimeline.length === 0 ? (
            <p className="text-forest-900/65">No consultations yet — start in the analyzer.</p>
          ) : (
            <>
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-8 top-19 right-4 h-0.75 rounded-full bg-teal/20 md:left-1/2 md:right-auto md:w-[calc(100%-4rem)] md:-translate-x-1/2"
                />
                <ul className="flex snap-x gap-6 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
                  {sortedTimeline.map((item) => (
                    <li key={item.id} className="relative flex w-31 shrink-0 snap-start flex-col md:w-35">
                      <Link
                        to={`/app/consultations/${item.id}`}
                        className="group relative z-1 flex flex-col rounded-2xl transition hover:bg-white/50"
                      >
                        <span
                          aria-hidden
                          className="mx-auto mb-2 flex h-2.75 w-2.75 rounded-full border-[3px] border-page bg-teal-muted shadow-[0_0_0_1px_rgb(45_106_106/0.25)]"
                        />
                        <div className="relative mx-auto mb-3 h-28 w-full max-w-30 overflow-hidden rounded-xl border border-card-border bg-white shadow-sm">
                          <ConsultationPhoto consultationId={item.id} />
                        </div>
                        <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-forest-900 group-hover:text-teal">
                          {item.predicted_disease}
                        </p>
                        <p className="mt-2 text-center text-[9px] uppercase tracking-wide text-forest-900/42">
                          {item.risk_level}
                        </p>
                        <time className="mt-2 text-center text-[10px] text-forest-900/42" dateTime={item.created_at}>
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </Link>
                      {compareMode ? (
                        <button
                          type="button"
                          onClick={() => toggleCompare(item.id)}
                          aria-pressed={compareIds.includes(item.id)}
                          className={`mt-2 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition ${
                            compareIds.includes(item.id)
                              ? "border-teal bg-teal text-white"
                              : "border-card-border bg-white/70 text-forest-900/70 hover:border-teal/40"
                          }`}
                        >
                          {compareIds.includes(item.id) ? "Selected" : "Select to compare"}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              {loading && items.length > 0 ? (
                <p className="mt-3 text-center text-xs text-forest-900/45">Loading…</p>
              ) : null}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  disabled={!canLoadMoreTimeline || loading}
                  onClick={() => setOffset(items.length)}
                  className="rounded-2xl border border-teal/30 bg-teal/8 px-5 py-2.5 text-sm font-semibold text-teal-strong disabled:opacity-40"
                >
                  Load older consultations
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-forest-900/42">
                Scroll sideways on narrow screens · tap a tile for full dossier
              </p>
            </>
          )}
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id}>
              <GlassCard className="p-4">
                <Link to={`/app/consultations/${item.id}`} className="flex gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-white/50">
                  <ConsultationPhoto consultationId={item.id} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-forest-900">{item.predicted_disease}</p>
                  <p className="text-xs capitalize text-forest-900/45">{item.predicted_skin_type}</p>
                  <p className="mt-2 text-xs text-forest-900/40">{new Date(item.created_at).toLocaleString()}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${riskStyles(item.risk_level)}`}
                  >
                    {item.risk_level}
                  </span>
                </div>
                </Link>
                {compareMode ? (
                  <button
                    type="button"
                    onClick={() => toggleCompare(item.id)}
                    aria-pressed={compareIds.includes(item.id)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      compareIds.includes(item.id)
                        ? "border-teal bg-teal text-white"
                        : "border-card-border bg-white/70 text-forest-900/70 hover:border-teal/40"
                    }`}
                  >
                    {compareIds.includes(item.id) ? "Selected for comparison" : "Select to compare"}
                  </button>
                ) : null}
              </GlassCard>
            </article>
          ))}
        </div>
      )}

      {compareMode && compareIds.length === 2 ? (
        <section aria-labelledby="comparison-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="comparison-heading" className="text-2xl font-semibold text-forest-900">Consultation comparison</h2>
              <p className="mt-1 text-sm text-forest-900/60">A side-by-side view of the information saved at each visit.</p>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-teal hover:bg-white/70"
            >
              <X className="h-4 w-4" aria-hidden /> Clear selection
            </button>
          </div>
          <StateBanner tone="info">
            This comparison describes stored records only. Differences in an AI category, confidence score, or triage
            level do not show clinical improvement or worsening. A qualified clinician can assess changes in your skin.
          </StateBanner>
          {compareLoading ? <p className="text-sm text-forest-900/60">Loading selected consultations…</p> : null}
          {compareError ? <StateBanner tone="error">{compareError}</StateBanner> : null}
          {compareRecords.length === 2 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {compareRecords.map((record) => (
                <GlassCard key={record.id} className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-forest-900/45">
                        {new Date(record.created_at).toLocaleString()}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-forest-900">{record.predicted_disease}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyles(record.risk_level)}`}>
                      {record.risk_level}
                    </span>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs uppercase tracking-wide text-forest-900/45">Model score</dt><dd className="mt-1 font-medium text-forest-900">{(record.disease_confidence * 100).toFixed(1)}% · {record.disease_confidence_level}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-forest-900/45">Estimated skin type</dt><dd className="mt-1 capitalize font-medium text-forest-900">{record.predicted_skin_type} · {(record.skin_type_confidence * 100).toFixed(0)}%</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-forest-900/45">Reported duration</dt><dd className="mt-1 font-medium text-forest-900">{record.duration || record.extracted_duration || "Not recorded"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-forest-900/45">Reported severity</dt><dd className="mt-1 font-medium capitalize text-forest-900">{record.severity || record.inferred_severity || "Not recorded"}</dd></div>
                  </dl>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/45">Symptoms and notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-forest-900/75">{record.symptoms || "No symptom text saved."}</p>
                  </div>
                  {record.red_flags?.length ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-950">
                      <p className="font-semibold">Recorded warning indicators</p>
                      <ul className="mt-1 list-disc pl-5">{record.red_flags.map((flag) => <li key={flag}>{flag.replaceAll("_", " ")}</li>)}</ul>
                    </div>
                  ) : <p className="text-xs text-forest-900/50">No warning indicators were recorded for this consultation.</p>}
                  <p className="border-t border-card-border pt-3 text-sm leading-relaxed text-forest-900/65">{record.doctor_warning}</p>
                  <Link to={`/app/consultations/${record.id}`} className="inline-flex text-sm font-semibold text-teal hover:text-teal-strong">Open full consultation →</Link>
                </GlassCard>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && items.length === 0 && viewMode === "grid" ? (
        <EmptyState
          title="No consultations yet"
          body="Start in Analyze to create your first dossier. Entries will appear here automatically."
          actions={
            <Link to="/app/analyze" className="inline-block font-medium text-sage-700">
              Open analyzer →
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
