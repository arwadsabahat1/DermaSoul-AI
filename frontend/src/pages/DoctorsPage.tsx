import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpRight, Languages, MapPin, Search, Stethoscope, Video } from "lucide-react";
import { fetchDermatologists } from "../api/dermatologists";
import type { Dermatologist } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";

export function DoctorsPage() {
  const [rows, setRows] = useState<Dermatologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [telemedicineOnly, setTelemedicineOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoadError(null);
        const data = await fetchDermatologists(false);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          const message = getApiErrorMessage(e, "Could not load dermatologists.");
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((doctor) => {
      if (telemedicineOnly && !doctor.telemedicine_available) return false;
      if (!needle) return true;
      const searchable = [
        doctor.full_name,
        doctor.clinic_name,
        doctor.city,
        doctor.country,
        doctor.specialties,
        doctor.supported_conditions,
        doctor.specialty_tags,
        doctor.languages,
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(needle);
    });
  }, [rows, search, telemedicineOnly]);

  function listValues(value: string | null | undefined) {
    return value?.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean) ?? [];
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Dermatology support"
        title="Find the right next conversation"
        description="Explore listed dermatology providers by location, specialty, or telemedicine availability. Contact a provider to confirm credentials, services, and appointment details."
      />
      <GlassCard className="overflow-visible border-teal/15 bg-linear-to-br from-white via-white to-teal/4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal">Provider search</p>
            <h2 className="mt-1 text-xl font-semibold text-forest-900">Explore the directory</h2>
          </div>
          {!loading ? (
            <span className="rounded-full bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal-deep" aria-live="polite">
              {filteredRows.length} {filteredRows.length === 1 ? "provider" : "providers"}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="text-sm font-semibold text-forest-900">
            Search by name, location, specialty, condition, or language
            <span className="relative mt-1.5 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-900/45" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. acne, Islamabad, telemedicine"
              className="w-full rounded-xl border border-card-border bg-white py-3 pl-10 pr-3 text-sm font-normal text-forest-900 placeholder:text-forest-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep"
            />
            </span>
          </label>
          <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${telemedicineOnly ? "border-teal bg-teal/8 text-teal-deep" : "border-card-border bg-white/70 text-forest-900/80 hover:bg-white"}`}>
            <input
              type="checkbox"
              checked={telemedicineOnly}
              onChange={(event) => setTelemedicineOnly(event.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            <Video className="h-4 w-4" aria-hidden />
            Telemedicine
          </label>
        </div>
        {(search || telemedicineOnly) ? (
          <button
            type="button"
            onClick={() => { setSearch(""); setTelemedicineOnly(false); }}
            className="mt-3 rounded-lg px-2 py-1 text-xs font-semibold text-teal-deep underline underline-offset-2 hover:bg-teal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep"
          >
            Clear filters
          </button>
        ) : null}
      </GlassCard>
      {loadError ? <StateBanner tone="error">{loadError}</StateBanner> : null}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2" aria-label="Loading provider directory">
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} className="space-y-4 p-5">
              <div className="flex gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></div></div>
              <Skeleton className="h-4 w-3/4" /><Skeleton className="h-10 w-full" />
            </GlassCard>
          ))}
        </div>
      ) : null}
      {!loading && filteredRows.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2" aria-live="polite">
          {filteredRows.map((doctor) => {
            const specialties = listValues(doctor.specialties || doctor.specialty_tags);
            const location = [doctor.city, doctor.country].filter(Boolean).join(", ");
            const languages = listValues(doctor.languages);
            const initials = doctor.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
            return (
              <article key={doctor.id} className="group h-full">
                <GlassCard className="flex h-full flex-col p-0 transition duration-200 hover:-translate-y-1 hover:border-teal/25 hover:shadow-lg">
                  <div className="flex items-start gap-4 p-5 pb-4">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-teal to-teal-deep text-lg font-bold text-white shadow-sm">
                      <span aria-hidden="true">{initials || <Stethoscope className="h-6 w-6" />}</span>
                      {doctor.profile_image_url ? (
                        <img src={doctor.profile_image_url} alt={`${doctor.full_name}, dermatologist`} className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.remove(); }} />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xl font-semibold text-forest-900">{doctor.full_name}</h3>
                      <p className="mt-0.5 text-sm text-forest-900/75">{doctor.clinic_name || "Independent practice"}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-forest-900/70">
                        <MapPin className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                        {location || "Location not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="px-5">
                    <div className="flex flex-wrap gap-2">
                      {doctor.years_experience !== null && doctor.years_experience !== undefined ? (
                        <span className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-forest-900/80">
                          {doctor.years_experience} {doctor.years_experience === 1 ? "year" : "years"} experience
                        </span>
                      ) : null}
                      {doctor.telemedicine_available ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal-deep">
                          <Video className="h-3.5 w-3.5" aria-hidden /> Telemedicine
                        </span>
                      ) : null}
                      {doctor.emergency_available ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950">
                          Emergency appointments may be available
                        </span>
                      ) : null}
                    </div>

                    {specialties.length ? (
                      <div className="mt-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-forest-900/50">Specialties</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {specialties.map((specialty) => (
                            <li key={specialty} className="rounded-lg border border-card-border bg-white px-2.5 py-1 text-xs font-medium text-forest-900/80">
                              {specialty}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {languages.length ? (
                      <p className="mt-3 flex items-start gap-2 text-sm text-forest-900/70">
                        <Languages className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                        <span><span className="font-medium text-forest-900">Languages:</span> {languages.join(", ")}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 border-t border-card-border px-5 py-4">
                    {doctor.booking_url ? (
                      <a href={doctor.booking_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2">
                        View booking options <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </a>
                    ) : null}
                    {doctor.contact_email ? (
                      <a href={`mailto:${doctor.contact_email}`} className="inline-flex min-h-10 items-center rounded-xl border border-card-border bg-white px-4 py-2 text-sm font-semibold text-forest-900 transition hover:border-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2">
                        Email provider
                      </a>
                    ) : null}
                    {doctor.contact_phone ? (
                      <a href={`tel:${doctor.contact_phone}`} className="inline-flex min-h-10 items-center rounded-xl border border-card-border bg-white px-4 py-2 text-sm font-semibold text-forest-900 transition hover:border-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep focus-visible:ring-offset-2">
                        Call provider
                      </a>
                    ) : null}
                    {!doctor.booking_url && !doctor.contact_email && !doctor.contact_phone ? (
                      <p className="text-sm text-forest-900/65">Contact details are not listed. Ask the directory administrator for current information.</p>
                    ) : null}
                  </div>
                </GlassCard>
              </article>
            );
          })}
        </div>
      ) : null}
      {!loading && rows.length === 0 ? (
        <EmptyState title="No dermatologists listed yet" body="Ask an administrator to add dermatology referrals." />
      ) : null}
      {!loading && rows.length > 0 && filteredRows.length === 0 ? (
        <EmptyState title="No matching providers" body="Try a different search term or clear the telemedicine filter." />
      ) : null}
    </div>
  );
}
