import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bookmark, Filter, Search } from "lucide-react";
import { fetchArticles } from "../api/education";
import { fetchConsultations } from "../api/consultations";
import { fetchProfile } from "../api/profile";
import type { EducationArticleSummary } from "../types/models";
import { getApiErrorMessage } from "../lib/errors";
import { ConditionCoverImage } from "../components/ui/ConditionCoverImage";
import { GlassCard } from "../components/ui/GlassCard";
import { mergeEducationLibrary } from "../constants/conditionsCatalog";
import { getConditionKnowledgeBySlug } from "../constants/conditionKnowledgeData";
import { useAuth } from "../contexts/AuthContext";
import { pickPersonalizedArticles } from "../lib/personalizedEducation";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";

const badgeFor = (title: string, i: number) => {
  const pool = ["Very common", "Common", "Frequent"] as const;
  const sev = ["Mild to moderate", "Variable", "Moderate"] as const;
  const h = (title.length + i) % pool.length;
  const s = (title.charCodeAt(0) + i) % sev.length;
  return { freq: pool[h], severity: sev[s] };
};

export function EducationPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [rawItems, setRawItems] = useState<EducationArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalizedPick, setPersonalizedPick] = useState<{
    articles: EducationArticleSummary[];
    note: string | null;
    loading: boolean;
  }>({ articles: [], note: null, loading: Boolean(user) });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCategory(searchParams.get("category") ?? "");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const list = await fetchArticles({
          limit: 200,
          offset: 0,
        });
        if (!cancelled) setRawItems(list);
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
  }, []);

  const fullLibrary = useMemo(() => mergeEducationLibrary(rawItems), [rawItems]);

  useEffect(() => {
    if (!user) {
      setPersonalizedPick({ articles: [], note: null, loading: false });
      return;
    }
    let cancelled = false;
    void (async () => {
      setPersonalizedPick((p) => ({ ...p, loading: true }));
      try {
        const [prof, consultations] = await Promise.all([
          fetchProfile(),
          fetchConsultations(1, 0),
        ]);
        if (cancelled) return;
        const latest = consultations.items[0] ?? null;
        const merged = mergeEducationLibrary(rawItems);
        const { articles, note } = pickPersonalizedArticles(merged, latest, prof?.known_allergies ?? null);
        setPersonalizedPick({ articles, note, loading: false });
      } catch {
        if (!cancelled) setPersonalizedPick({ articles: [], note: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, rawItems]);

  const categories = useMemo(() => {
    return [...new Set(fullLibrary.map((a) => a.category).filter(Boolean))].sort();
  }, [fullLibrary]);

  const sortedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = category.trim().toLowerCase();

    let list = fullLibrary;
    if (q) {
      list = list.filter((a) => {
        const hay = `${a.title} ${a.summary ?? ""} ${a.slug} ${a.category} ${a.warnings ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (cat) {
      list = list.filter((a) => a.category.toLowerCase() === cat);
    }
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [fullLibrary, search, category]);

  return (
    <div className="text-slate-text">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-teal via-teal-strong to-page pb-12 pt-8 md:pb-16 md:pt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgb(255_255_255/0.16),transparent)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <h1
            className="text-3xl font-semibold tracking-tight text-white md:text-4xl md:leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Skin conditions library
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/88 md:text-lg">
            Explore dermatology education DermaSoul pairs with analysis—overviews, cautions, and practical guidance. Not a
            substitute for in-person care.
          </p>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, symptom, tag…"
                className="w-full rounded-xl border border-white/25 bg-white/15 py-3.5 pl-12 pr-4 text-sm font-medium text-white outline-none backdrop-blur-md transition placeholder:text-white/55 focus:border-white/45 focus:bg-white/20"
              />
            </div>
            <div className="relative md:max-w-[200px]">
              <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-white/15 py-3.5 pl-10 pr-10 text-sm font-semibold text-white outline-none backdrop-blur-md focus:border-white/45"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="text-slate-text">
                    {c}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70">▾</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/65">
            {loading ? "Loading library…" : `Showing ${sortedItems.length} article${sortedItems.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {loadError ? <StateBanner tone="error">{loadError}</StateBanner> : null}
        {user && personalizedPick.articles.length > 0 ? (
          <section className="mb-12 rounded-3xl border border-teal/[0.2] bg-gradient-to-br from-teal/[0.09] via-card to-card p-5 shadow-card md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Bookmark className="h-5 w-5 shrink-0 text-teal-strong" aria-hidden />
              <h2 className="text-xl font-semibold text-teal-deep md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                Picked for your latest analysis
              </h2>
            </div>
            {personalizedPick.note ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-text/76">{personalizedPick.note}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-text/65">
                Based on your most recent Skin Analysis prediction and categories in the library.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-text/55">Recommendations are educational prompts, not confirmed diagnoses.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {personalizedPick.articles.map((a) => (
                <Link
                  key={a.slug}
                  to={`/conditions/${a.slug}`}
                  className="group flex gap-4 overflow-hidden rounded-2xl border border-card-border bg-card p-4 shadow-sm transition hover:border-teal/35 hover:shadow-md"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-page">
                    <ConditionCoverImage slug={a.slug} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-teal">{a.category}</p>
                    <p className="mt-1 line-clamp-2 font-semibold text-teal-deep group-hover:text-teal">{a.title}</p>
                    {a.summary ? (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-text/65">{a.summary}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : user && personalizedPick.loading ? (
          <p className="mb-8 text-sm text-slate-text/55">Personalizing picks from your profile…</p>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <GlassCard key={`s-${i}`} className="space-y-3 p-5">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-16 w-full" />
                </GlassCard>
              ))
            : null}
          {sortedItems.map((a, i) => {
            const { freq, severity } = badgeFor(a.title, i);
            const isPlaceholder = a.id.startsWith("catalog-");
            const knowledge = getConditionKnowledgeBySlug(a.slug);
            const previewSigns = knowledge?.common_signs.slice(0, 3) ?? [];
            const topRedFlag = knowledge?.red_flags[0] ?? null;
            const overview = knowledge?.brief_overview ?? a.summary ?? null;
            return (
              <article
                key={a.slug}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link to={`/conditions/${a.slug}`} className="flex h-full flex-col">
                  <div className="relative h-44 overflow-hidden bg-page">
                    <ConditionCoverImage
                      slug={a.slug}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-deep/85 via-teal-deep/15 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.14),transparent_50%)]" />
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-teal px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                        {freq}
                      </span>
                      <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-teal-deep shadow-sm ring-1 ring-card-border">
                        {severity}
                      </span>
                      {isPlaceholder ? (
                        <span className="rounded-lg bg-white/18 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25">
                          Default overview
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-teal">{a.category}</p>
                    <h2
                      className="mt-2 text-xl font-semibold tracking-tight text-teal-deep group-hover:text-teal md:text-[1.35rem]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {a.title}
                    </h2>
                    {overview ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-text/72">{overview}</p>
                    ) : (
                      <p className="mt-2 text-sm italic text-slate-text/45">Open for full guidance.</p>
                    )}
                    {previewSigns.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {previewSigns.map((sign) => (
                          <span
                            key={sign}
                            className="rounded-full bg-teal/[0.08] px-2.5 py-1 text-[11px] font-medium text-teal-deep ring-1 ring-teal/15"
                          >
                            {sign}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {topRedFlag ? (
                      <p className="mt-3 line-clamp-2 rounded-lg border border-red-200/60 bg-red-50/70 px-3 py-2 text-xs font-medium text-red-900">
                        Red flag: {topRedFlag}
                      </p>
                    ) : a.warnings ? (
                      <p className="mt-3 line-clamp-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
                        {a.warnings}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center text-sm font-bold text-teal transition group-hover:gap-1">
                      Read overview <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {!loading && sortedItems.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="No articles match" body="Try clearing search or choosing “All categories”." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
