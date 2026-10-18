import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, X } from "lucide-react";
import { createDermatologist, deleteDermatologist, fetchDermatologists, updateDermatologist } from "../api/dermatologists";
import type { Dermatologist } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { getApiErrorMessage } from "../lib/errors";

const EMPTY_FORM = {
  full_name: "",
  clinic_name: "",
  city: "",
  country: "",
  specialties: "",
  supported_conditions: "",
  specialty_tags: "",
  regions_served: "",
  telemedicine_available: false,
  emergency_available: false,
  languages: "",
  years_experience: "",
  contact_email: "",
  contact_phone: "",
  booking_url: "",
  profile_image_url: "",
  notes: "",
  is_active: true,
};

export function AdminDermatologistsPage() {
  const [rows, setRows] = useState<Dermatologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchDermatologists(true));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not load dermatologists."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const canSubmit = useMemo(() => form.full_name.trim().length >= 2, [form.full_name]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function startEditing(doctor: Dermatologist) {
    setEditingId(doctor.id);
    setForm({
      full_name: doctor.full_name,
      clinic_name: doctor.clinic_name ?? "",
      city: doctor.city ?? "",
      country: doctor.country ?? "",
      specialties: doctor.specialties ?? "",
      supported_conditions: doctor.supported_conditions ?? "",
      specialty_tags: doctor.specialty_tags ?? "",
      regions_served: doctor.regions_served ?? "",
      telemedicine_available: doctor.telemedicine_available,
      emergency_available: doctor.emergency_available,
      languages: doctor.languages ?? "",
      years_experience: doctor.years_experience?.toString() ?? "",
      contact_email: doctor.contact_email ?? "",
      contact_phone: doctor.contact_phone ?? "",
      booking_url: doctor.booking_url ?? "",
      profile_image_url: doctor.profile_image_url ?? "",
      notes: doctor.notes ?? "",
      is_active: doctor.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave() {
    const payload = {
      full_name: form.full_name.trim(),
      clinic_name: form.clinic_name.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      specialties: form.specialties.trim() || null,
      supported_conditions: form.supported_conditions.trim() || null,
      specialty_tags: form.specialty_tags.trim() || null,
      regions_served: form.regions_served.trim() || null,
      telemedicine_available: form.telemedicine_available,
      emergency_available: form.emergency_available,
      languages: form.languages.trim() || null,
      years_experience: form.years_experience ? Number(form.years_experience) : null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      booking_url: form.booking_url.trim() || null,
      profile_image_url: form.profile_image_url.trim() || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateDermatologist(editingId, payload);
        toast.success("Dermatologist updated.");
      } else {
        await createDermatologist(payload);
        toast.success("Dermatologist added.");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editingId ? "Could not update dermatologist." : "Could not add dermatologist."));
    }
  }

  async function onToggleActive(doctor: Dermatologist) {
    try {
      await updateDermatologist(doctor.id, { is_active: !doctor.is_active });
      toast.success(`Dermatologist ${doctor.is_active ? "disabled" : "enabled"}.`);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this dermatologist entry?")) return;
    try {
      await deleteDermatologist(id);
      if (editingId === id) resetForm();
      toast.success("Dermatologist removed.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
      <GlassCard className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal">Directory management</p>
            <h2 className="mt-1 text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {editingId ? "Edit dermatologist" : "Add dermatologist"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-forest-900/70">A public HTTPS profile-photo URL is optional. Use an image approved for directory display.</p>
          </div>
          {editingId ? <Button variant="secondary" className="px-3 py-2 text-xs" onClick={resetForm}><X className="h-4 w-4" /> Cancel</Button> : null}
        </div>

        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-forest-900">Full name
            <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Dr. Full Name" value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} />
          </label>
          <label className="block text-sm font-medium text-forest-900">Clinic / practice
            <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Clinic name" value={form.clinic_name} onChange={(event) => setForm((prev) => ({ ...prev, clinic_name: event.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-forest-900">City
              <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="City" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-forest-900">Country
              <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
            </label>
          </div>
          <label className="block text-sm font-medium text-forest-900">Profile photo URL <span className="font-normal text-forest-900/60">(optional · HTTPS)</span>
            <input type="url" inputMode="url" className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="https://example.org/provider-photo.jpg" value={form.profile_image_url} onChange={(event) => setForm((prev) => ({ ...prev, profile_image_url: event.target.value }))} />
          </label>
          {form.profile_image_url ? (
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-white/70 p-3">
              <img src={form.profile_image_url} alt="Profile photo preview" className="h-14 w-14 rounded-full bg-page object-cover" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
              <span className="text-xs text-forest-900/70">Photo preview · initials appear if the image cannot load</span>
            </div>
          ) : null}
          <label className="block text-sm font-medium text-forest-900">Specialties
            <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="e.g. Medical dermatology, acne" value={form.specialties} onChange={(event) => setForm((prev) => ({ ...prev, specialties: event.target.value }))} />
          </label>
          <label className="block text-sm font-medium text-forest-900">Supported conditions <span className="font-normal text-forest-900/60">(comma-separated)</span>
            <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Acne, eczema" value={form.supported_conditions} onChange={(event) => setForm((prev) => ({ ...prev, supported_conditions: event.target.value }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-forest-900">Languages
              <input className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="English, Urdu" value={form.languages} onChange={(event) => setForm((prev) => ({ ...prev, languages: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-forest-900">Years of experience
              <input type="number" min="0" max="80" className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Years" value={form.years_experience} onChange={(event) => setForm((prev) => ({ ...prev, years_experience: event.target.value }))} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-forest-900">Email
              <input type="email" className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="name@example.com" value={form.contact_email} onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-forest-900">Phone
              <input type="tel" className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="Phone number" value={form.contact_phone} onChange={(event) => setForm((prev) => ({ ...prev, contact_phone: event.target.value }))} />
            </label>
          </div>
          <label className="block text-sm font-medium text-forest-900">Booking URL
            <input type="url" className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" placeholder="https://…" value={form.booking_url} onChange={(event) => setForm((prev) => ({ ...prev, booking_url: event.target.value }))} />
          </label>
          <label className="block text-sm font-medium text-forest-900">Internal notes
            <textarea className="mt-1 w-full rounded-xl border border-card-border bg-page px-3 py-2.5 text-sm" rows={3} placeholder="Notes for directory administrators" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-card-border pt-3">
            <label className="flex items-center gap-2 text-sm text-forest-900"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} /> Active for referrals</label>
            <label className="flex items-center gap-2 text-sm text-forest-900"><input type="checkbox" checked={form.telemedicine_available} onChange={(event) => setForm((prev) => ({ ...prev, telemedicine_available: event.target.checked }))} /> Telemedicine</label>
            <label className="flex items-center gap-2 text-sm text-forest-900"><input type="checkbox" checked={form.emergency_available} onChange={(event) => setForm((prev) => ({ ...prev, emergency_available: event.target.checked }))} /> Emergency appointments</label>
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={() => void onSave()}>{editingId ? "Save changes" : "Add dermatologist"}</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal">Provider records</p>
            <h2 className="mt-1 text-xl text-forest-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Directory</h2>
          </div>
          <span className="rounded-full bg-teal/8 px-3 py-1 text-xs font-semibold text-teal-deep">{rows.length} listed</span>
        </div>
        {loading ? <p className="mt-3 text-sm text-forest-900/70">Loading directory…</p> : null}
        <div className="mt-4 space-y-3">
          {rows.map((doctor) => (
            <article key={doctor.id} className="rounded-2xl border border-card-border bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {doctor.profile_image_url ? (
                    <img src={doctor.profile_image_url} alt={`${doctor.full_name} profile`} className="h-12 w-12 shrink-0 rounded-full bg-page object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-bold text-teal-deep">
                      {doctor.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-forest-900">{doctor.full_name}</p>
                    <p className="truncate text-xs text-forest-900/65">{[doctor.city, doctor.country].filter(Boolean).join(", ") || "Location not specified"}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${doctor.is_active ? "bg-emerald-50 text-emerald-900" : "bg-slate-100 text-slate-700"}`}>
                  {doctor.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => startEditing(doctor)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => void onToggleActive(doctor)}>{doctor.is_active ? "Disable" : "Enable"}</Button>
                <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => void onDelete(doctor.id)}>Delete</Button>
              </div>
            </article>
          ))}
          {!loading && rows.length === 0 ? <EmptyState title="No dermatologists yet" body="Add a provider to populate the public directory." /> : null}
        </div>
      </GlassCard>
    </div>
  );
}
