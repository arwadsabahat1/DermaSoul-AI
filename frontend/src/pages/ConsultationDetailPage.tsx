import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import {
  deleteConsultation,
  downloadConsultationPdf,
  fetchConsultation,
} from "../api/consultations";
import type { ConsultationDetail } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { ConsultationPhoto } from "../components/ui/ConsultationPhoto";
import { Skeleton, SkeletonLines } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { getApiErrorMessage } from "../lib/errors";
import { riskStyles } from "../lib/risk";

function ListBlock({ title, rows }: { title: string; rows: string[] | null | undefined }) {
  if (!rows?.length) return null;
  return (
    <GlassCard>
      <h3 className="text-lg font-medium text-forest-900">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-forest-900/75">
        {rows.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchConsultation(id);
        if (!cancelled) setC(data);
      } catch (e) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(e, "Could not load consultation."));
          navigate("/app/consultations", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  async function onDelete() {
    if (!id || !c) return;
    if (!window.confirm("Delete this consultation and its stored image? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      await deleteConsultation(id);
      toast.success("Consultation removed.");
      navigate("/app/consultations", { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  async function onPdf() {
    if (!id || !c) return;
    setPdfBusy(true);
    try {
      await downloadConsultationPdf(id, `dermasoul_report_${id.slice(0, 8)}.pdf`);
      toast.success("PDF downloaded.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "PDF download failed."));
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading || !c) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-16">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-72 w-full" />
        <SkeletonLines rows={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <StateBanner tone="success">
        Summary first: review risk and warning context before diving into detailed recommendation blocks.
      </StateBanner>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/app/consultations"
          className="inline-flex items-center gap-2 text-sm font-medium text-sage-700 hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to ledger
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/app/consultations/${id}/faq`}
            className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-semibold text-teal-deep shadow-sm transition hover:border-teal/30"
          >
            Condition FAQs
          </Link>
          <Button type="button" variant="secondary" loading={pdfBusy} onClick={() => void onPdf()}>
            <Download className="h-4 w-4" /> PDF report
          </Button>
          <Button type="button" variant="danger" loading={deleting} onClick={() => void onDelete()}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid items-stretch gap-6 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
          <GlassCard className="p-4">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-forest-900/5 md:aspect-square">
              <ConsultationPhoto consultationId={c.id} />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-forest-900/35">Captured</p>
            <p className="text-sm text-forest-900/70">{new Date(c.created_at).toLocaleString()}</p>
          </GlassCard>

          <div className="space-y-6">
          <GlassCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-forest-900/50">Primary signal</p>
                <h1
                  className="text-4xl text-forest-900"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {c.predicted_disease}
                </h1>
                <p className="text-sm text-forest-900/65">
                  {(c.disease_confidence * 100).toFixed(1)}% confidence · {c.disease_confidence_level}
                </p>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${riskStyles(c.risk_level)}`}>
                {c.risk_level}
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-forest-900/75">{c.doctor_warning}</p>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-medium">Skin type</h3>
            <p className="mt-2 capitalize text-forest-900/80">
              {c.predicted_skin_type} · {(c.skin_type_confidence * 100).toFixed(0)}% ·{" "}
              {c.skin_type_confidence_level}
            </p>
          </GlassCard>
          </div>
        </div>

        <div className="space-y-6">
          {(c.skin_tone || c.fitzpatrick_type || c.ethnicity_region) && (
            <GlassCard>
              <h3 className="text-lg font-medium">Context you provided</h3>
              <dl className="mt-3 grid gap-2 text-sm text-forest-900/75">
                {c.skin_tone ? (
                  <div>
                    <dt className="font-medium text-forest-900/45">Skin tone</dt>
                    <dd>{c.skin_tone}</dd>
                  </div>
                ) : null}
                {c.fitzpatrick_type ? (
                  <div>
                    <dt className="font-medium text-forest-900/45">Fitzpatrick</dt>
                    <dd>{c.fitzpatrick_type}</dd>
                  </div>
                ) : null}
                {c.ethnicity_region ? (
                  <div>
                    <dt className="font-medium text-forest-900/45">Region</dt>
                    <dd>{c.ethnicity_region}</dd>
                  </div>
                ) : null}
              </dl>
              {c.melanin_context_note ? (
                <p className="mt-4 text-sm leading-relaxed text-forest-900/70">{c.melanin_context_note}</p>
              ) : null}
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="text-lg font-medium">Symptoms & notes</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-forest-900/75">{c.symptoms}</p>
            {c.medical_history ? (
              <p className="mt-4 whitespace-pre-wrap text-sm text-forest-900/60">{c.medical_history}</p>
            ) : null}
            {c.extracted_symptoms?.length ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-forest-900/35">Extracted cues</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.extracted_symptoms.map((s) => (
                    <span key={s} className="rounded-full bg-sage-400/20 px-3 py-1 text-xs text-forest-900">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {c.severity_rationale ? (
              <p className="mt-3 text-sm text-forest-900/65">
                Severity interpretation: {c.severity_rationale}
              </p>
            ) : null}
          </GlassCard>

          <ListBlock title="General guidance" rows={c.general_care_guidance} />
          <ListBlock title="OTC-support ideas" rows={c.otc_support_guidance} />
          <ListBlock title="Avoid" rows={c.what_to_avoid} />
          <ListBlock title="Precautions" rows={c.safety_precautions} />

          {c.assessment_summary ? (
            <GlassCard>
              <h3 className="text-lg font-medium">Assessment</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-forest-900/75">
                {c.assessment_summary}
              </p>
            </GlassCard>
          ) : null}
          <StateBanner tone="info">
            Compare-readiness tip: when comparing multiple dossiers, match date, risk band, and confidence before trend
            interpretation.
          </StateBanner>

          {c.recommendations?.length ? (
            <GlassCard>
              <h3 className="text-lg font-medium">Product-style suggestions</h3>
              <ul className="mt-3 space-y-3">
                {c.recommendations.map((row, idx) => (
                  <li
                    key={idx}
                    className="rounded-2xl border border-white/30 bg-white/40 p-4 text-sm text-forest-900/80"
                  >
                    {row && typeof row === "object" ? (
                      <dl className="space-y-1.5">
                        {Object.entries(row).map(([k, v]) => (
                          <div key={k} className="flex flex-wrap gap-2">
                            <dt className="min-w-[8rem] text-xs uppercase tracking-wider text-forest-900/40">
                              {k.replace(/_/g, " ")}
                            </dt>
                            <dd className="flex-1 text-forest-900/80">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      String(row)
                    )}
                  </li>
                ))}
              </ul>
              {c.recommendation_safety_note ? (
                <p className="mt-4 text-xs text-forest-900/55">{c.recommendation_safety_note}</p>
              ) : null}
            </GlassCard>
          ) : null}

          {c.referred_dermatologists?.length ? (
            <GlassCard>
              <h3 className="text-lg font-medium">Dermatologist referrals</h3>
              {c.referral_note ? <p className="mt-2 text-sm text-forest-900/70">{c.referral_note}</p> : null}
              <div className="mt-3 space-y-3">
                {c.referred_dermatologists.map((doctor) => (
                  <div key={doctor.id} className="rounded-2xl border border-card-border bg-white/50 p-3">
                    <p className="font-semibold text-forest-900">{doctor.full_name}</p>
                    <p className="text-sm text-forest-900/70">{doctor.clinic_name ?? "Independent practice"}</p>
                    <p className="text-xs text-forest-900/50">
                      {[doctor.city, doctor.country].filter(Boolean).join(", ") || "Location not specified"}
                    </p>
                    {doctor.booking_url ? (
                      <a href={doctor.booking_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-teal hover:text-teal-strong">
                        Book consultation →
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}

          {c.retrieved_knowledge?.length ? (
            <GlassCard>
              <h3 className="text-lg font-medium">Knowledge snippets</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-forest-900/70">
                {c.retrieved_knowledge.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </GlassCard>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
