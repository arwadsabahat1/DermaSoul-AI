import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { createAdminProduct, deleteAdminProduct, updateAdminProduct, type ProductMutationInput } from "../api/admin";
import { fetchProducts } from "../api/products";
import type { Product } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FormHint } from "../components/ui/FormHint";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";

const EMPTY_FORM: ProductMutationInput = {
  name: "",
  brand: "",
  category: "",
  ingredients: "",
  suitable_skin_types: "",
  supported_conditions: "",
  avoid_if_allergic_to: "",
  contraindications: "",
  price_range: "",
  availability: "",
  product_url: "",
};

export function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductMutationInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchProducts();
        if (!cancelled) setItems(list);
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

  function beginEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      brand: p.brand ?? "",
      category: p.category ?? "",
      ingredients: p.ingredients ?? "",
      suitable_skin_types: p.suitable_skin_types ?? "",
      supported_conditions: p.supported_conditions ?? "",
      avoid_if_allergic_to: p.avoid_if_allergic_to ?? "",
      contraindications: p.contraindications ?? "",
      price_range: p.price_range ?? "",
      availability: p.availability ?? "",
      product_url: p.product_url ?? "",
    });
  }

  function resetEditor() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function cleanPayload(payload: ProductMutationInput) {
    const out: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(payload)) {
      out[k] = (v ?? "").toString().trim() || null;
    }
    out.name = payload.name.trim();
    out.category = payload.category.trim();
    return out;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      const msg = "Name and category are required.";
      setFormError(msg);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = cleanPayload(form);
      if (editing) {
        const updated = await updateAdminProduct(editing.id, payload);
        setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Product updated.");
      } else {
        const created = await createAdminProduct(payload as ProductMutationInput);
        setItems((prev) => [created, ...prev]);
        toast.success("Product created.");
      }
      resetEditor();
    } catch (e2) {
      setFormError(getApiErrorMessage(e2));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this OTC shelf item?")) return;
    try {
      await deleteAdminProduct(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (editing?.id === id) resetEditor();
      toast.success("Product deleted.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            OTC shelf management
          </h2>
          <Button variant="secondary" className="px-3 py-2 text-xs" onClick={resetEditor}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            : null}
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-card-border bg-white/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-forest-900">{p.name}</p>
                  <p className="text-xs text-forest-900/45">{p.brand || "No brand"} · {p.category}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="secondary" className="min-h-0 px-2.5 py-1.5 text-xs" onClick={() => beginEdit(p)}>
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="danger" className="min-h-0 px-2.5 py-1.5 text-xs" onClick={() => void onDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
              {p.avoid_if_allergic_to ? <FormHint className="mt-2">{p.avoid_if_allergic_to}</FormHint> : null}
            </div>
          ))}
          {loading ? <p className="text-sm text-forest-900/55">Loading products…</p> : null}
          {!loading && items.length === 0 ? <EmptyState title="No products seeded" /> : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <h2 className="text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {editing ? "Edit product" : "Create product"}
        </h2>
        {formError ? <StateBanner tone="error" className="mt-3">{formError}</StateBanner> : null}
        <form className="mt-4 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          {(
            [
              ["name", "Name *"],
              ["brand", "Brand"],
              ["category", "Category *"],
              ["suitable_skin_types", "Suitable skin types"],
              ["supported_conditions", "Supported conditions"],
              ["price_range", "Price range"],
              ["availability", "Availability"],
              ["product_url", "Product URL"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-forest-900/45">{label}</span>
              <input
                value={(form[key] ?? "") as string}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-2 text-sm outline-none focus:border-teal/45"
              />
              {key === "product_url" ? <FormHint>Use full URL including https:// for external product links.</FormHint> : null}
            </label>
          ))}
          {(
            [
              ["ingredients", "Ingredients"],
              ["avoid_if_allergic_to", "Avoid if allergic to"],
              ["contraindications", "Contraindications"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-forest-900/45">{label}</span>
              <textarea
                rows={3}
                value={(form[key] ?? "") as string}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-card-border bg-page px-3 py-2 text-sm outline-none focus:border-teal/45"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              {editing ? "Update product" : "Create product"}
            </Button>
            {editing ? (
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
