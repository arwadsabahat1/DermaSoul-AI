import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  createEducationArticle,
  deleteEducationArticle,
  fetchArticle,
  fetchArticles,
  updateEducationArticle,
  type EducationMutationInput,
} from "../api/education";
import type { EducationArticleSummary } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FormHint } from "../components/ui/FormHint";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";
import { slugifyConditionLabel } from "../constants/conditionsCatalog";

const EMPTY_FORM: EducationMutationInput = {
  title: "",
  slug: "",
  category: "",
  summary: "",
  content: "",
  warnings: "",
  precautions: "",
  when_to_seek_doctor: "",
  source_urls: "",
};

export function AdminEducationPage() {
  const [items, setItems] = useState<EducationArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<EducationMutationInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchArticles({ limit: 200, offset: 0 });
        if (!cancelled) setItems(list.sort((a, b) => a.title.localeCompare(b.title)));
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

  function beginEdit(article: EducationArticleSummary) {
    setEditingSlug(article.slug);
    void (async () => {
      try {
        const detail = await fetchArticle(article.slug);
        setForm({
          title: detail.title,
          slug: detail.slug,
          category: detail.category,
          summary: detail.summary ?? "",
          content: detail.content,
          warnings: detail.warnings ?? "",
          precautions: detail.precautions ?? "",
          when_to_seek_doctor: detail.when_to_seek_doctor ?? "",
          source_urls: detail.source_urls ?? "",
        });
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not load article details."));
      }
    })();
  }

  function resetEditor() {
    setEditingSlug(null);
    setForm(EMPTY_FORM);
  }

  function cleanPayload(payload: EducationMutationInput) {
    const out: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(payload)) {
      out[k] = (v ?? "").toString().trim() || null;
    }
    out.title = payload.title.trim();
    out.category = payload.category.trim();
    out.content = payload.content.trim();
    return out;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || form.content.trim().length < 20) {
      const msg = "Title, category, and content (>= 20 chars) are required.";
      setFormError(msg);
      return;
    }
    setFormError(null);

    if (form.title.trim().length > 200) {
      setFormError("Title must be 200 characters or fewer.");
      return;
    }
    if ((form.slug ?? "").trim().length > 200) {
      setFormError("Slug must be 200 characters or fewer.");
      return;
    }
    if (form.category.trim().length > 100) {
      setFormError("Category must be 100 characters or fewer.");
      return;
    }

    setSaving(true);
    try {
      const payload = cleanPayload(form);
      const normalizedSlug = (payload.slug?.trim() || slugifyConditionLabel(payload.title ?? "")).slice(0, 200);
      payload.slug = normalizedSlug;

      if (editingSlug) {
        const updated = await updateEducationArticle(editingSlug, payload);
        setItems((prev) =>
          prev.map((a) =>
            a.slug === editingSlug
              ? {
                  id: updated.id,
                  title: updated.title,
                  slug: updated.slug,
                  category: updated.category,
                  summary: updated.summary,
                  warnings: updated.warnings,
                  updated_at: updated.updated_at,
                }
              : a,
          ),
        );
        toast.success("Article updated.");
      } else {
        const existing = items.find((a) => a.slug === normalizedSlug);
        if (existing) {
          const updated = await updateEducationArticle(existing.slug, payload);
          setItems((prev) =>
            prev
              .map((a) =>
                a.slug === existing.slug
                  ? {
                      id: updated.id,
                      title: updated.title,
                      slug: updated.slug,
                      category: updated.category,
                      summary: updated.summary,
                      warnings: updated.warnings,
                      updated_at: updated.updated_at,
                    }
                  : a,
              )
              .sort((a, b) => a.title.localeCompare(b.title)),
          );
          toast.success("Existing condition article updated.");
        } else {
          const created = await createEducationArticle(payload as EducationMutationInput);
          setItems((prev) =>
            [
              {
                id: created.id,
                title: created.title,
                slug: created.slug,
                category: created.category,
                summary: created.summary,
                warnings: created.warnings,
                updated_at: created.updated_at,
              },
              ...prev,
            ].sort((a, b) => a.title.localeCompare(b.title)),
          );
          toast.success("Article created.");
        }
      }
      resetEditor();
    } catch (e2) {
      setFormError(getApiErrorMessage(e2));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(slug: string) {
    if (!window.confirm(`Delete article "${slug}"?`)) return;
    try {
      await deleteEducationArticle(slug);
      setItems((prev) => prev.filter((a) => a.slug !== slug));
      if (editingSlug === slug) resetEditor();
      toast.success("Article deleted.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  const titleLen = form.title.trim().length;
  const slugLen = (form.slug ?? "").trim().length;
  const categoryLen = form.category.trim().length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Disease library management
          </h2>
          <Button variant="secondary" className="px-3 py-2 text-xs" onClick={resetEditor}>
            <Plus className="h-4 w-4" /> New article
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            : null}
          {items.map((a) => (
            <div key={a.id} className="rounded-xl border border-card-border bg-white/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-forest-900">{a.title}</p>
                  <p className="text-xs text-forest-900/45">
                    {a.slug} · {a.category}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="secondary" className="min-h-0 px-2.5 py-1.5 text-xs" onClick={() => beginEdit(a)}>
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="danger" className="min-h-0 px-2.5 py-1.5 text-xs" onClick={() => void onDelete(a.slug)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
              {a.summary ? <p className="mt-2 line-clamp-2 text-sm text-forest-900/65">{a.summary}</p> : null}
            </div>
          ))}
          {loading ? <p className="text-sm text-forest-900/55">Loading articles…</p> : null}
          {!loading && items.length === 0 ? <EmptyState title="No articles yet" body="Create your first disease-library article." /> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {editingSlug ? "Edit article" : "Create article"}
        </h2>
        {formError ? <StateBanner tone="error" className="mt-3">{formError}</StateBanner> : null}
        <form className="mt-4 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          {(
            [
              ["title", "Title *"],
              ["slug", "Slug (optional)"],
              ["category", "Category *"],
              ["source_urls", "Sources"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-forest-900/45">{label}</span>
                {key === "title" ? (
                  <span className={`text-[11px] ${titleLen > 200 ? "text-red-700" : "text-forest-900/45"}`}>{titleLen}/200</span>
                ) : null}
                {key === "slug" ? (
                  <span className={`text-[11px] ${slugLen > 200 ? "text-red-700" : "text-forest-900/45"}`}>{slugLen}/200</span>
                ) : null}
                {key === "category" ? (
                  <span className={`text-[11px] ${categoryLen > 100 ? "text-red-700" : "text-forest-900/45"}`}>{categoryLen}/100</span>
                ) : null}
              </div>
              <input
                value={(form[key] ?? "") as string}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                maxLength={key === "category" ? 100 : key === "source_urls" ? 5000 : 200}
                className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-2 text-sm outline-none focus:border-teal/45"
              />
              {key === "source_urls" ? <FormHint>Add one or more trusted sources, comma or newline separated.</FormHint> : null}
            </label>
          ))}
          {(
            [
              ["summary", "Summary"],
              ["content", "Content *"],
              ["warnings", "Warnings"],
              ["precautions", "Precautions"],
              ["when_to_seek_doctor", "When to seek doctor"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-forest-900/45">{label}</span>
              <textarea
                rows={key === "content" ? 7 : 3}
                value={(form[key] ?? "") as string}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-2 text-sm outline-none focus:border-teal/45"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              {editingSlug ? "Update article" : "Create article"}
            </Button>
            {editingSlug ? (
              <Button type="button" variant="ghost" onClick={resetEditor}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
