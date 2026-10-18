import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { fetchArticle, fetchArticleKnowledge } from "../api/education";
import type { EducationArticle, EducationKnowledge } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Skeleton, SkeletonLines } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";
import { ConditionCoverImage } from "../components/ui/ConditionCoverImage";
import { conditionCoverAlt } from "../constants/conditionCovers";
import { buildFallbackArticleForSlug, isCanonicalEducationSlug } from "../constants/conditionsCatalog";

type LoadState = "loading" | "ready" | "missing";

function nonEmpty(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

function hydrateArticleContent(article: EducationArticle, slug: string): EducationArticle {
  const fallback = buildFallbackArticleForSlug(slug);
  if (!fallback) return article;

  const merged = { ...article };
  merged.summary = nonEmpty(article.summary) ?? fallback.summary;
  merged.content = nonEmpty(article.content) ?? fallback.content;
  merged.warnings = nonEmpty(article.warnings) ?? fallback.warnings;
  merged.precautions = nonEmpty(article.precautions) ?? fallback.precautions;
  merged.when_to_seek_doctor = nonEmpty(article.when_to_seek_doctor) ?? fallback.when_to_seek_doctor;
  merged.source_urls = nonEmpty(article.source_urls) ?? fallback.source_urls;
  return merged;
}

function parseSources(raw: string | null | undefined): string[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  return text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function EducationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<EducationArticle | null>(null);
  const [knowledge, setKnowledge] = useState<EducationKnowledge | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!slug) {
      setLoadState("missing");
      return;
    }
    let cancelled = false;
    setLoadState("loading");
    setArticle(null);
    setKnowledge(null);
    void (async () => {
      try {
        const [data, knowledgeData] = await Promise.all([
          fetchArticle(slug),
          fetchArticleKnowledge(slug).catch(() => null),
        ]);
        if (!cancelled) {
          setArticle(hydrateArticleContent(data, slug));
          setKnowledge(knowledgeData);
          setLoadState("ready");
        }
      } catch (e) {
        if (cancelled) return;
        const fallback = buildFallbackArticleForSlug(slug);
        const allowFallback =
          fallback &&
          axios.isAxiosError(e) &&
          (e.response?.status === 404 || e.code === "ERR_NETWORK");
        if (allowFallback) {
          setArticle(fallback);
          const knowledgeData = await fetchArticleKnowledge(slug).catch(() => null);
          if (!cancelled) setKnowledge(knowledgeData);
          setLoadState("ready");
          if (e.code === "ERR_NETWORK") {
            toast("Showing a default overview until the library connection is restored.");
          }
        } else {
          toast.error(getApiErrorMessage(e, "Article not found."));
          setLoadState("missing");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-4xl space-y-4 bg-page px-4 pb-16 pt-4 md:px-6 md:pt-6">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <SkeletonLines rows={6} />
      </div>
    );
  }

  if (loadState === "missing" || !article) {
    return (
      <div className="mx-auto max-w-lg bg-page px-4 py-16 text-center">
        <Link to="/conditions" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-strong">
          <ArrowLeft className="h-4 w-4" /> Library
        </Link>
        <p className="mt-6 text-lg font-semibold text-forest-900">Article not available</p>
        <p className="mt-2 text-sm text-forest-900/65">
          This slug is not in the education library. Return to the conditions list to choose a topic.
        </p>
      </div>
    );
  }

  const showOfflineNote = article.id.startsWith("catalog-") && slug && isCanonicalEducationSlug(slug);
  const sources = parseSources(article.source_urls);
  const knowledgeSources = knowledge?.source_urls ?? [];
  const mergedSources = [...new Set([...knowledgeSources, ...sources])];
  const conditionOverview = nonEmpty(knowledge?.brief_overview) ?? nonEmpty(article.summary);

  return (
    <article className="mx-auto max-w-4xl space-y-8 bg-page px-4 pb-16 pt-4 text-slate-text md:px-6 md:pt-6">
      <Link to="/conditions" className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal-strong">
        <ArrowLeft className="h-4 w-4" /> Library
      </Link>
      {showOfflineNote ? (
        <StateBanner tone="info" className="border-amber-200/80 bg-amber-50/90 text-amber-950">
          You are viewing the default in-app overview. Connect the server and run the education seed for the curated
          version of this article.
        </StateBanner>
      ) : null}
      <figure className="overflow-hidden rounded-2xl bg-teal-deep/25 shadow-card ring-1 ring-card-border">
        <ConditionCoverImage
          slug={article.slug}
          alt={conditionCoverAlt(article.title)}
          className="h-52 w-full object-cover md:h-64"
          loading="eager"
        />
      </figure>
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-sage-600">{article.category}</p>
        <h1
          className="mt-3 text-4xl md:text-5xl text-forest-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {article.title}
        </h1>
        {conditionOverview ? <p className="mt-4 text-lg text-forest-900/65">{conditionOverview}</p> : null}
      </header>
      {conditionOverview ? (
        <GlassCard className="border-teal/20 bg-gradient-to-br from-teal/[0.08] via-card to-card">
          <h2 className="text-lg font-semibold text-teal-deep">About this condition</h2>
          <p className="mt-2 text-sm leading-relaxed text-forest-900/80">{conditionOverview}</p>
        </GlassCard>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest-900/40">Education mode</p>
          <p className="mt-2 text-sm text-forest-900/75">Informational support, not a medical diagnosis.</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest-900/40">Best use</p>
          <p className="mt-2 text-sm text-forest-900/75">Use this page to prepare better questions for your clinician.</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-forest-900/40">Escalate if worse</p>
          <p className="mt-2 text-sm text-forest-900/75">Rapid spread, severe pain, fever, bleeding, or non-healing lesions.</p>
        </GlassCard>
      </section>

      {article.warnings ? (
        <GlassCard className="border-amber-200/60 bg-amber-50/50">
          <h2 className="text-lg font-semibold text-amber-950">Warnings</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950/85">{article.warnings}</p>
        </GlassCard>
      ) : null}

      <GlassCard>
        <h2 className="text-lg font-medium text-forest-900">Guidance</h2>
        <div className="mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-forest-900/80">
          {article.content}
        </div>
      </GlassCard>
      {knowledge ? (
        <section className="grid gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold text-forest-900">Common signs</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-forest-900/80">
              {knowledge.common_signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold text-forest-900">Common causes or triggers</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-forest-900/80">
              {knowledge.common_triggers_or_causes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold text-forest-900">General care guidance</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-forest-900/80">
              {knowledge.general_care_guidance.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold text-forest-900">OTC support guidance</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-forest-900/80">
              {knowledge.otc_support_guidance.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </GlassCard>
        </section>
      ) : null}
      {knowledge?.what_to_avoid?.length ? (
        <GlassCard>
          <h2 className="text-lg font-medium text-forest-900">What to avoid</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-forest-900/80">
            {knowledge.what_to_avoid.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
      {knowledge?.red_flags?.length ? (
        <GlassCard className="border-red-200/50 bg-red-50/35">
          <h2 className="text-lg font-semibold text-red-950">Red flags</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-red-900/85">
            {knowledge.red_flags.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
      {knowledge?.professional_note ? (
        <StateBanner tone="info">{knowledge.professional_note}</StateBanner>
      ) : null}
      <StateBanner tone="info">
        Recommendation clarity: use this article for education and discussion prep, then confirm treatment decisions with a
        clinician.
      </StateBanner>

      {article.precautions ? (
        <GlassCard>
          <h2 className="text-lg font-medium">Precautions</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-forest-900/75">{article.precautions}</p>
        </GlassCard>
      ) : null}

      {article.when_to_seek_doctor ? (
        <GlassCard className="border-red-200/50 bg-red-50/35">
          <h2 className="text-lg font-semibold text-red-950">When to seek a clinician</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-red-900/85">{article.when_to_seek_doctor}</p>
        </GlassCard>
      ) : null}

      {mergedSources.length > 0 || article.source_urls ? (
        <GlassCard>
          <h2 className="text-lg font-medium">Sources</h2>
          {mergedSources.length ? (
            <ul className="mt-3 space-y-2 text-sm text-forest-900/70">
              {mergedSources.map((src) => {
                const isUrl = /^https?:\/\//i.test(src);
                return (
                  <li key={src} className="break-all">
                    {isUrl ? (
                      <a href={src} target="_blank" rel="noreferrer" className="text-teal hover:text-teal-strong hover:underline">
                        {src}
                      </a>
                    ) : (
                      src
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm text-forest-900/65">{article.source_urls}</p>
          )}
        </GlassCard>
      ) : null}
    </article>
  );
}
