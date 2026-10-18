import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, FlaskConical, Search, ScanLine, ShieldCheck } from "lucide-react";
import { fetchProducts } from "../api/products";
import { fetchProfile } from "../api/profile";
import type { Product, Profile } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";
import { analyzeIngredientLabel, type IngredientAnalysisResult } from "../lib/ingredientAnalysis";

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [labelPaste, setLabelPaste] = useState("");
  const [scanResult, setScanResult] = useState<IngredientAnalysisResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("");

  useEffect(() => {
    void fetchProfile()
      .then(setProfile)
      .catch(() => {
        /* optional if session expired */
      });
  }, []);

  const categories = useMemo(
    () => [...new Set(items.map((product) => product.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const skinTypes = useMemo(
    () => [...new Set(items.flatMap((product) => product.suitable_skin_types?.split(/[,;|]/).map((value) => value.trim()).filter(Boolean) ?? []))]
      .sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((product) => {
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (skinTypeFilter && !product.suitable_skin_types?.toLowerCase().includes(skinTypeFilter.toLowerCase())) return false;
      if (!needle) return true;
      const searchable = [product.name, product.brand, product.category, product.ingredients, product.suitable_skin_types,
        product.supported_conditions, product.avoid_if_allergic_to, product.contraindications]
        .filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(needle);
    });
  }, [items, search, categoryFilter, skinTypeFilter]);

  function profileAllergyMatch(product: Product): boolean {
    const allergies = profile?.known_allergies?.split(/[,;|\n]+/).map((item) => item.trim().toLowerCase()).filter(Boolean) ?? [];
    const avoid = product.avoid_if_allergic_to?.toLowerCase() ?? "";
    return allergies.some((allergy) => allergy.length > 1 && avoid.includes(allergy));
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoadError(null);
        const list = await fetchProducts();
        if (!cancelled) setItems(list);
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

  function runIngredientScan() {
    if (!labelPaste.trim()) {
      toast.error("Paste an ingredients list first.");
      return;
    }
    setScanResult(analyzeIngredientLabel(labelPaste, profile?.known_allergies ?? null, items));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <PageHeader
        eyebrow="Curated OTC studio shelf"
        title="Skincare, with the details up front"
        description="Browse catalog entries, check the information on a product label, and review listed cautions. These entries are educational—not prescriptions or endorsements."
      />

      <GlassCard className="overflow-visible border-teal/15 bg-linear-to-br from-white via-white to-teal/4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal-deep"><FlaskConical className="h-5 w-5" aria-hidden /></span>
            <div>
              <h2 className="text-lg font-semibold text-forest-900">Browse the shelf</h2>
              <p className="text-sm text-forest-900/70">Search product details or narrow by catalog category and skin type.</p>
            </div>
          </div>
          {!loading ? <span className="rounded-full bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal-deep" aria-live="polite">{filteredItems.length} of {items.length} products</span> : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(2,minmax(150px,0.28fr))]">
          <label className="text-sm font-semibold text-forest-900">
            Search products
            <span className="relative mt-1.5 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-900/50" aria-hidden />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, ingredient, brand, condition…" className="w-full rounded-xl border border-card-border bg-page py-3 pl-10 pr-3 text-sm font-normal text-forest-900 placeholder:text-forest-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep" />
            </span>
          </label>
          <label className="text-sm font-semibold text-forest-900">
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-3 text-sm font-normal text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep">
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-forest-900">
            Skin type
            <select value={skinTypeFilter} onChange={(event) => setSkinTypeFilter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-3 text-sm font-normal text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep">
              <option value="">All skin types</option>
              {skinTypes.map((skinType) => <option key={skinType} value={skinType}>{skinType}</option>)}
            </select>
          </label>
        </div>
        {(search || categoryFilter || skinTypeFilter) ? (
          <button type="button" onClick={() => { setSearch(""); setCategoryFilter(""); setSkinTypeFilter(""); }} className="mt-3 rounded-lg px-2 py-1 text-xs font-semibold text-teal-deep underline underline-offset-2 hover:bg-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep">Clear filters</button>
        ) : null}
      </GlassCard>

      <GlassCard className="space-y-4 border-teal/20 bg-linear-to-br from-card via-page to-teal/4">
        <div className="flex flex-wrap items-center gap-2">
          <ScanLine className="h-5 w-5 text-teal-strong" aria-hidden />
          <h2 className="text-2xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Ingredient label checker
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-forest-900/80">
          Paste an INCI / ingredients list from packaging. We flag common{" "}
          <strong className="font-semibold text-forest-900">topical steroid cues</strong>, frequent{" "}
          <strong className="font-semibold text-forest-900">contact allergens</strong>, matches to your{" "}
          <strong className="font-semibold text-forest-900">profile allergy notes</strong>, and rough overlap with this
          shelf&apos;s <strong className="font-semibold text-forest-900">avoid-if-allergic</strong> fields. Educational
          heuristics only—not a substitute for patch testing or your clinician.
        </p>
        {profile?.known_allergies ? (
          <p className="rounded-2xl bg-white/60 px-3 py-2 text-xs text-forest-900/80">
            Using profile allergies: <span className="font-medium text-forest-900">{profile.known_allergies}</span>
          </p>
        ) : (
          <p className="text-xs text-forest-900/70">
            Add known allergies in <strong>Profile</strong> to cross-check pasted labels automatically.
          </p>
        )}
        <label className="block text-sm font-semibold text-forest-900" htmlFor="inci-label-input">
          Ingredients from the product packaging
        <textarea
          id="inci-label-input"
          value={labelPaste}
          onChange={(e) => setLabelPaste(e.target.value)}
          rows={5}
          placeholder="e.g. Aqua, glycerin, hydrocortisone 1%, phenoxyethanol, fragrance…"
          className="mt-2 w-full resize-y rounded-2xl border border-card-border bg-white px-4 py-3 text-sm font-normal text-forest-900 outline-none placeholder:text-forest-900/55 focus-visible:ring-2 focus-visible:ring-teal-deep"
        />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => runIngredientScan()}
            className="min-h-11 rounded-2xl bg-forest-900 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-soft transition hover:bg-forest-800 focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2"
          >
            Scan label
          </button>
          <button
            type="button"
            onClick={() => {
              setLabelPaste("");
              setScanResult(null);
            }}
            className="min-h-11 rounded-2xl border border-card-border bg-white px-5 py-2.5 text-sm font-semibold text-forest-900"
          >
            Clear
          </button>
        </div>

        {scanResult ? (
          <div className="space-y-4 border-t border-card-border pt-5 text-sm" role="status" aria-live="polite">
            {scanResult.steroidFlags.length ? (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3" role="alert">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-950">Steroid / corticosteroid cues</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950/90">
                  {scanResult.steroidFlags.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-950/75">
                  Using steroid creams without supervision can mask infection or thin skin; confirm with a clinician.
                </p>
              </div>
            ) : null}
            {scanResult.labelAllergenHits.length ? (
              <div className="rounded-2xl border border-sage-400/40 bg-sage-400/10 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-forest-900">Common allergen / irritant hits</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {scanResult.labelAllergenHits.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-forest-900 ring-1 ring-teal/15"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {scanResult.profileAllergyHits.length ? (
              <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3" role="alert">
                <p className="text-xs font-bold uppercase tracking-wider text-red-950">Profile overlap</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-red-900/90">
                  {scanResult.profileAllergyHits.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {scanResult.productWarnings.length ? (
              <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-forest-900/45">Matches this catalog</p>
                <ul className="mt-3 space-y-3">
                  {scanResult.productWarnings.map((pw) => (
                    <li key={`${pw.productName}-${pw.note.slice(0, 24)}`} className="text-forest-900/80">
                      <span className="font-semibold text-forest-900">{pw.productName}</span>
                      <p className="mt-1 text-xs leading-relaxed text-forest-900/70">{pw.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!scanResult.steroidFlags.length &&
            !scanResult.labelAllergenHits.length &&
            !scanResult.profileAllergyHits.length &&
            !scanResult.productWarnings.length ? (
              <p className="text-forest-900/55">
                No patterned hits in this pass—still verify with your clinician, especially for new products.
              </p>
            ) : null}
          </div>
        ) : null}
      </GlassCard>

      {loadError ? <StateBanner tone="error">{loadError}</StateBanner> : null}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-14 w-full" />
            </GlassCard>
          ))}
        </div>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2" aria-live="polite">
          {filteredItems.map((p, i) => {
            const hasAllergyNote = profileAllergyMatch(p);
            return (
              <motion.article key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.035, 0.2) }} className="h-full">
                <GlassCard className="flex h-full flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:border-teal/25 hover:shadow-lg">
                  <div className="bg-linear-to-br from-teal-deep to-teal px-5 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">{p.category}</p>
                        <h3 className="mt-1 text-2xl font-semibold leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{p.name}</h3>
                        {p.brand ? <p className="mt-1 text-sm text-white/80">{p.brand}</p> : null}
                      </div>
                      {p.product_url ? (
                        <a href={p.product_url} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white" aria-label={`Open ${p.name} product information in a new tab`}>
                          <ExternalLink className="h-5 w-5" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex flex-wrap gap-2">
                      {p.suitable_skin_types ? <span className="rounded-full bg-teal/8 px-3 py-1 text-xs font-semibold text-teal-deep">Skin types: {p.suitable_skin_types}</span> : null}
                      {p.availability ? <span className="rounded-full bg-page px-3 py-1 text-xs font-medium text-forest-900/80">{p.availability}</span> : null}
                      {p.price_range ? <span className="rounded-full bg-page px-3 py-1 text-xs font-medium text-forest-900/80">{p.price_range}</span> : null}
                    </div>
                    {hasAllergyNote ? (
                      <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-950" role="alert">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span><strong>Check against your profile allergies:</strong> {p.avoid_if_allergic_to}</span>
                      </p>
                    ) : p.avoid_if_allergic_to ? (
                      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span><strong>Allergy caution:</strong> {p.avoid_if_allergic_to}</span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        No allergy-specific caution is listed in this catalog entry. Always check the package label.
                      </p>
                    )}

                    <details className="rounded-xl border border-card-border bg-page/65 p-3">
                      <summary className="cursor-pointer font-semibold text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep">Product details and cautions</summary>
                      <div className="mt-3 space-y-3 text-sm leading-relaxed text-forest-900/80">
                        {p.ingredients ? <p><strong>Listed ingredients:</strong> {p.ingredients}</p> : <p>Ingredients are not listed in this catalog entry.</p>}
                        {p.supported_conditions ? <p><strong>Catalog notes:</strong> {p.supported_conditions}</p> : null}
                        {p.contraindications ? <p className="text-amber-950"><strong>Contraindications / cautions:</strong> {p.contraindications}</p> : null}
                      </div>
                    </details>

                    <p className="mt-auto border-t border-card-border pt-3 text-xs leading-relaxed text-forest-900/70">
                      Catalog information is educational, may be incomplete or outdated, and is not a treatment recommendation. Verify the current package label and ask a pharmacist or clinician if unsure.
                    </p>
                  </div>
                </GlassCard>
              </motion.article>
            );
          })}
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState title="Catalog awaits seeding" body="No OTC entries are available yet. Add products from Admin to populate this shelf." />
      ) : null}
      {!loading && items.length > 0 && filteredItems.length === 0 ? (
        <EmptyState title="No matching products" body="Try another search term or clear the category and skin-type filters." />
      ) : null}
    </div>
  );
}
