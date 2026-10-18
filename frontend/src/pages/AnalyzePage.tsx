import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Camera,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  ImageIcon,
  Info,
  Shield,
  Sparkles,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton, SkeletonLines } from "../components/ui/Skeleton";
import { StateBanner } from "../components/ui/StateBanner";
import { analyzeDiagnosis } from "../api/diagnosis";
import type { DiagnosisResponse } from "../types/models";
import { getApiErrorMessage } from "../lib/errors";
import { riskStyles } from "../lib/risk";

const fitzOptions = ["", "I", "II", "III", "IV", "V", "VI"] as const;
const skinToneOptions = [
  "",
  "Very fair",
  "Fair",
  "Light-medium",
  "Medium",
  "Olive",
  "Brown",
  "Deep brown",
  "Very deep",
] as const;
const ancestryRegionOptions = [
  "",
  "African / African diaspora",
  "East Asian",
  "South Asian",
  "Southeast Asian",
  "Middle Eastern / North African",
  "Latino / Hispanic",
  "European",
  "Indigenous / Native",
  "Mixed / multiracial",
  "Other",
] as const;

const fieldClass =
  "mt-2 w-full rounded-xl border border-card-border bg-page px-4 py-3 text-sm text-slate-text outline-none transition focus-visible:border-teal-deep focus-visible:ring-2 focus-visible:ring-teal-deep/40";

function HelpTooltip({ text, label }: { text: string; label: string }) {
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="group inline-flex h-4 w-4 items-center justify-center rounded-full text-teal-deep/80 transition hover:text-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30"
        aria-label={label}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.45rem)] z-20 w-56 -translate-x-1/2 rounded-lg border border-card-border bg-white px-2.5 py-2 text-left text-[11px] font-medium normal-case leading-relaxed text-slate-text opacity-0 shadow-card transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {text}
        </span>
      </button>
    </span>
  );
}

export function AnalyzePage() {
  const browseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [affectedArea, setAffectedArea] = useState("");
  const [changePattern, setChangePattern] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [fitzpatrick, setFitzpatrick] = useState<string>("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [drag, setDrag] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const canAnalyze = Boolean(file && symptoms.trim().length >= 5);
  const resultHasUrgentFlags = Boolean(result?.red_flags?.length);
  const resultIsHighRisk = result?.risk_level.trim().toLowerCase() === "high";
  const urgentSafety = resultHasUrgentFlags || resultIsHighRisk;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onPickFile(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
    ev.target.value = "";
  }

  function onDrop(ev: DragEvent) {
    ev.preventDefault();
    setDrag(false);
    const f = ev.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a skin photograph (JPG or PNG).");
      return;
    }
    if (symptoms.trim().length < 5) {
      toast.error("Describe symptoms in at least 5 characters.");
      return;
    }
    const fd = new FormData();
    fd.append("image", file);
    const guidedDetails = [
      affectedArea.trim() ? `Affected area: ${affectedArea.trim()}.` : "",
      changePattern ? `Recent pattern: ${changePattern}.` : "",
      recentChanges.trim() ? `Recent product or medicine changes: ${recentChanges.trim()}.` : "",
    ].filter(Boolean);
    fd.append("symptoms", [symptoms.trim(), ...guidedDetails].join("\n"));
    if (duration.trim()) fd.append("duration", duration.trim());
    if (severity) fd.append("severity", severity);
    if (medicalHistory.trim()) fd.append("medical_history", medicalHistory.trim());
    if (skinTone.trim()) fd.append("skin_tone", skinTone.trim());
    if (fitzpatrick) fd.append("fitzpatrick_type", fitzpatrick);
    if (region.trim()) fd.append("ethnicity_region", region.trim());

    setBusy(true);
    try {
      const data = await analyzeDiagnosis(fd);
      setResult(data);
      toast.success("Assessment ready — review calmly below.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Analysis could not finish."));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {busy ? "Analysis in progress. Please wait while your image and symptom information are reviewed." : ""}
        {!busy && result ? `Analysis complete. Results are ready. ${urgentSafety ? "Urgent safety guidance is available at the start of the results." : "Review the guidance at the start of the results."}` : ""}
      </div>
      <PageHeader
        eyebrow="AI analysis"
        title="Skin condition analysis"
        description="Upload a clear image, add symptom context, and review an educational AI-assisted overview with transparent confidence bands."
        className="mb-5"
      />
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-teal via-teal-strong to-teal-deep p-6 text-white shadow-card md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/70">AI analysis / DermaSoul</p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/88">
          Upload or capture a clear skin image, describe your symptoms, and get a structured AI-assisted overview—always
          with educational framing, not a formal diagnosis.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ImageIcon, t: "Image-based analysis", d: "Upload or capture the affected area." },
            { icon: ClipboardList, t: "Symptom context", d: "Duration, itch, pain, spread, or triggers." },
            { icon: Shield, t: "Safe guidance", d: "Transparent confidence with medical disclaimers." },
          ].map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-md transition hover:bg-white/15"
            >
              <Icon className="h-5 w-5 text-white/95" strokeWidth={1.75} />
              <p className="mt-3 text-sm font-bold">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/78">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-4"
          >
            <section
              role={urgentSafety ? "alert" : "status"}
              aria-live={urgentSafety ? "assertive" : "polite"}
              aria-atomic="true"
              className={`rounded-2xl border p-5 shadow-card ${
                urgentSafety
                  ? "border-red-300 bg-red-50 text-red-950"
                  : "border-amber-200 bg-amber-50/80 text-amber-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <h2 className="font-bold">
                    {urgentSafety ? "Safety guidance — read first" : "Important guidance"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed">{result.doctor_warning}</p>
                  {result.when_to_seek_doctor ? (
                    <p className="mt-2 text-sm leading-relaxed">
                      <strong>When to seek care:</strong> {result.when_to_seek_doctor}
                    </p>
                  ) : null}
                  {resultHasUrgentFlags ? (
                    <div className="mt-3">
                      <p className="text-sm font-semibold">Reported warning indicators</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                        {result.red_flags.map((flag) => <li key={flag}>{flag.replaceAll("_", " ")}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {urgentSafety ? (
                    <p className="mt-3 border-t border-red-300/70 pt-3 text-sm font-semibold">
                      Do not rely on this model result or product suggestions to assess or treat an urgent problem. If
                      you think this is an emergency, contact your local emergency service.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <GlassCard className="border-teal/20 bg-linear-to-br from-card via-page to-teal/6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-text/60">AI-estimated category · not a diagnosis</p>
                  <p className="text-3xl font-semibold text-teal-deep" style={{ fontFamily: "var(--font-display)" }}>
                    {result.predicted_disease}
                  </p>
                  <p className="mt-1 text-sm text-slate-text/65">
                    Confidence {(result.disease_confidence * 100).toFixed(1)}% · {result.disease_confidence_level}
                  </p>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${riskStyles(result.risk_level)}`}>
                  Triage level: {result.risk_level}
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-card-border bg-white/65 p-4">
                <p className="text-sm font-semibold text-slate-text">How to read this result</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-text/70">
                  The confidence score describes the model output; it is not the probability that you have this
                  condition and does not confirm a diagnosis. A clinician may reach a different conclusion after an
                  examination.
                </p>
                {result.llm_confidence_statement ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-text/70">{result.llm_confidence_statement}</p>
                ) : null}
              </div>
              <details className="mt-4 rounded-xl border border-card-border bg-white/55 p-4">
                <summary className="cursor-pointer font-semibold text-teal-deep">
                  Technical details and context
                </summary>
                <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
                  <p><strong>Estimated skin type:</strong> <span className="capitalize">{result.predicted_skin_type}</span> · {(result.skin_type_confidence * 100).toFixed(0)}% model score</p>
                  <p><strong>Image quality score:</strong> {result.blur_score}</p>
                  {result.severity_rationale ? <p><strong>Symptom context:</strong> {result.severity_rationale}</p> : null}
                  {result.urgency_rationale ? <p><strong>Urgency context:</strong> {result.urgency_rationale}</p> : null}
                </div>
              </details>
              {(result.assessment_summary || result.condition_explanation || result.symptom_context ||
                result.llm_next_steps?.length) ? (
                <details className="mt-4 rounded-xl border border-card-border bg-white/55 p-4">
                  <summary className="cursor-pointer font-semibold text-teal-deep">
                    What contributed to this overview?
                  </summary>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-text/75">
                    {result.assessment_summary ? <p>{result.assessment_summary}</p> : null}
                    {result.condition_explanation ? <p>{result.condition_explanation}</p> : null}
                    {result.symptom_context ? <p>{result.symptom_context}</p> : null}
                    {result.llm_next_steps?.length ? (
                      <div>
                        <p className="font-semibold text-slate-text">Suggested next steps</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {result.llm_next_steps.map((step) => <li key={step}>{step}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}
              {result.recommendation_safety_note ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
                  <strong>Product safety:</strong> {result.recommendation_safety_note}
                </p>
              ) : null}
              {result.safety_precautions?.length ? (
                <div className="mt-4 rounded-xl border border-card-border bg-white/55 p-4">
                  <p className="font-semibold text-slate-text">Safety precautions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-text/75">
                    {result.safety_precautions.map((precaution) => <li key={precaution}>{precaution}</li>)}
                  </ul>
                </div>
              ) : null}
              {result.ai_limitations ? (
                <p className="mt-4 text-xs leading-relaxed text-slate-text/55">
                  <strong>Limitations:</strong> {result.ai_limitations}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/app/consultations/${result.consultation_id}`}
                  className="rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-semibold text-teal-deep shadow-sm transition hover:border-teal/30"
                >
                  View full dossier →
                </Link>
                {result.suggested_education_slug ? (
                  <Link
                    to={`/conditions/${result.suggested_education_slug}`}
                    className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-teal-strong"
                  >
                    Read: {result.suggested_education_title ?? "Guide"}
                  </Link>
                ) : null}
              </div>

              {result.referred_dermatologists?.length ? (
                <div className="mt-6 rounded-xl border border-teal/30 bg-teal/6 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep/70">
                    Refer to dermatologist
                  </p>
                  <p className="mt-2 text-sm text-slate-text/75">
                    {typeof result.referral_note === "string" && result.referral_note.trim()
                      ? result.referral_note
                      : "Your assessment indicates follow-up with a licensed dermatologist is recommended."}
                  </p>
                  <div className="mt-3 space-y-2">
                    {result.referred_dermatologists.slice(0, 2).map((doctor) => (
                      <div key={doctor.id} className="rounded-lg border border-card-border bg-white/70 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-text">{doctor.full_name}</p>
                        <p className="text-xs text-slate-text/60">
                          {[doctor.clinic_name, doctor.city, doctor.country].filter(Boolean).join(" · ") ||
                            "Dermatology specialist"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.referred_dermatologists[0]?.booking_url ? (
                      <a
                        href={result.referred_dermatologists[0].booking_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-teal-strong"
                      >
                        Book dermatologist consultation
                      </a>
                    ) : null}
                    <Link
                      to="/app/doctors"
                      className="rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-semibold text-teal-deep shadow-sm transition hover:border-teal/30"
                    >
                      Browse dermatologist directory
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-card-border bg-white/55 p-4">
                  <p className="text-sm text-slate-text/70">
                    Need an expert review? Connect with a licensed dermatologist for a formal diagnosis.
                  </p>
                  <Link
                    to="/app/doctors"
                    className="mt-3 inline-flex rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-semibold text-teal-deep shadow-sm transition hover:border-teal/30"
                  >
                    Refer to dermatologist
                  </Link>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {busy ? (
        <div aria-busy="true">
          <GlassCard className="space-y-4">
          <p className="text-sm font-semibold text-forest-900/80">Processing your image and context…</p>
          <Skeleton className="h-10 w-56" />
          <SkeletonLines rows={4} />
          </GlassCard>
        </div>
      ) : null}

      <StateBanner tone="info" className="flex gap-3 md:items-start">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
        <p>
          <span className="font-bold">Medical disclaimer:</span> DermaSoul provides educational information only. It is not a
          substitute for a dermatologist or emergency medical care.
        </p>
      </StateBanner>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-teal-deep">
                  <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
                  <h2 className="text-lg font-bold">Skin image</h2>
                </div>
                <p id="image-help" className="mt-1 text-sm text-slate-text/80">Upload or capture a clear JPG or PNG image of the affected area.</p>
              </div>
            </div>
            <input
              ref={browseRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              aria-label="Choose a skin image from your device"
              aria-describedby="image-help image-selection-status"
              onChange={onPickFile}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="hidden"
              onChange={onPickFile}
              aria-label="Capture a skin image with your camera"
              aria-describedby="image-help image-selection-status"
            />
            <p id="image-selection-status" className="sr-only" role="status" aria-live="polite">
              {file ? `Selected image: ${file.name}.` : "No image selected."}
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`mt-6 flex min-h-55 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
                drag ? "border-teal bg-teal/6" : "border-card-border bg-page"
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-md">
                  <img
                    src={previewUrl}
                    alt="Selected skin photograph preview"
                    className="mx-auto max-h-56 rounded-xl object-contain shadow-inner"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setFile(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-teal-deep p-2 text-white shadow-lg transition hover:bg-teal-strong"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => browseRef.current?.click()}
                  className="flex flex-col items-center gap-4 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-inner">
                    <Upload className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-slate-text">Click to upload skin image</span>
                  <span className="text-xs text-slate-text/55">PNG or JPG recommended</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-card-border bg-card py-3 text-sm font-bold text-teal-deep shadow-sm transition hover:border-teal/50 hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-deep"
            >
              <Camera className="h-4 w-4" aria-hidden /> Open camera
            </button>
          </section>

          <section className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-teal-deep">
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
              <h2 className="text-lg font-bold">Symptoms</h2>
            </div>
                <p className="mt-1 text-sm text-slate-text/80">Type what you noticed about your skin.</p>
            <label className="mt-6 block text-sm font-medium text-slate-text">
              Description (required)
              <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-text/60">
                If you can, include where it is, when it began, what it looks or feels like, whether it is changing or
                spreading, and any recent new medicines or products. Skip anything you are unsure about.
              </span>
              <textarea
                required
                minLength={5}
                maxLength={2000}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className={`${fieldClass} min-h-35 resize-y`}
                placeholder='Example: "Redness and itching on my cheek for 3 days. The area feels dry and slightly painful…"'
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-text/55">
              <span>{symptoms.length} of 2000 characters</span>
              <button
                type="button"
                className="font-semibold text-teal hover:text-teal-strong"
                onClick={() => setSymptoms("")}
              >
                Clear symptoms
              </button>
            </div>
          </section>

          <aside className="grid gap-6 md:grid-cols-2 lg:col-span-2">
            <section className="rounded-2xl border border-card-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 text-teal-deep">
                <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
                <h2 className="text-base font-bold">Better input tips</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-text/75">
                {[
                  "Use a clear, well-lit photo of the affected area.",
                  "Mention duration, itching, pain, redness, swelling, or spreading.",
                  "Avoid blurry photos, heavy filters, or makeup covering the lesion.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-teal/25 bg-linear-to-br from-teal/[0.07] to-page p-5 shadow-card">
              <div className="flex items-center gap-2 text-teal-deep">
                <Shield className="h-5 w-5" strokeWidth={1.75} />
                <h2 className="text-base font-bold">Safety note</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-text/72">
                Seek urgent professional help for breathing difficulty, lip or eye swelling, a rapidly spreading rash,
                fever, severe pain, pus, or bleeding.
              </p>
            </section>
          </aside>
        </div>

        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-teal-deep">
            <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            <h2 className="text-lg font-bold">More symptom context <span className="text-sm font-normal text-slate-text/55">(optional)</span></h2>
          </div>
          <p className="mt-1 text-sm text-slate-text/60">Share only what you know. You can leave any field blank.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-text">
              Where is it?
              <input
                value={affectedArea}
                onChange={(event) => setAffectedArea(event.target.value)}
                maxLength={120}
                className={fieldClass}
                placeholder="e.g. left forearm, near the wrist"
              />
            </label>
            <label className="block text-sm font-medium text-slate-text">
              How is it changing?
              <select value={changePattern} onChange={(event) => setChangePattern(event.target.value)} className={fieldClass}>
                <option value="">Not sure / not specified</option>
                <option value="staying about the same">Staying about the same</option>
                <option value="improving">Improving</option>
                <option value="getting worse">Getting worse</option>
                <option value="spreading or changing quickly">Spreading or changing quickly</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-text">
              Duration
              <input value={duration} onChange={(event) => setDuration(event.target.value)} maxLength={100} className={fieldClass} placeholder="e.g. 5 days" />
            </label>
            <label className="block text-sm font-medium text-slate-text">
              Severity
              <select value={severity} onChange={(event) => setSeverity(event.target.value)} className={fieldClass}>
                <option value="">Not specified</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-text md:col-span-2">
              New products or medicines around the time it began?
              <input
                value={recentChanges}
                onChange={(event) => setRecentChanges(event.target.value)}
                maxLength={300}
                className={fieldClass}
                placeholder="Mention only what you know; do not stop prescribed medicine based on this tool."
              />
            </label>
            <label className="block text-sm font-medium text-slate-text md:col-span-2">
              Other medical notes
              <textarea value={medicalHistory} onChange={(event) => setMedicalHistory(event.target.value)} maxLength={2000} rows={3} className={`${fieldClass} resize-y`} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
          <p className="text-sm font-bold text-teal-deep">Melanin-aware context (optional)</p>
          <p className="mt-1 text-xs text-slate-text/60">Helps tailor language—not a substitute for examination.</p>
          <div className="mt-5 grid items-stretch gap-5 md:grid-cols-3">
            <label className="flex flex-col text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                Skin tone (descriptive)
                <HelpTooltip
                  label="Skin tone help"
                  text="A broad descriptive tone category used to phrase guidance more inclusively."
                />
              </span>
              <p className="mt-1 min-h-10 text-xs font-normal leading-5 text-slate-text/70">
                Optional. Helps tailor wording for different tones.
              </p>
              <select value={skinTone} onChange={(e) => setSkinTone(e.target.value)} className={fieldClass}>
                {skinToneOptions.map((o) => (
                  <option key={o || "none"} value={o}>
                    {o || "Prefer not to say"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                Fitzpatrick type
                <HelpTooltip
                  label="Fitzpatrick type help"
                  text="A dermatology scale (Type I-VI) that describes how skin reacts to sun exposure and tanning."
                />
              </span>
              <p className="mt-1 min-h-10 text-xs font-normal leading-5 text-slate-text/70">
                Optional. Useful for clinical context in skin evaluation.
              </p>
              <select
                value={fitzpatrick}
                onChange={(e) => setFitzpatrick(e.target.value)}
                className={fieldClass}
              >
                {fitzOptions.map((o) => (
                  <option key={o || "none"} value={o}>
                    {o ? `Type ${o}` : "Prefer not to say"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                Region / ancestry context
                <HelpTooltip
                  label="Region and ancestry help"
                  text="Optional background context to support culturally and tone-aware educational wording."
                />
              </span>
              <p className="mt-1 min-h-10 text-xs font-normal leading-5 text-slate-text/70">
                Optional. Pick what best matches your background.
              </p>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={fieldClass}>
                {ancestryRegionOptions.map((o) => (
                  <option key={o || "none"} value={o}>
                    {o || "Prefer not to say"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-teal-deep">Ready for analysis?</h2>
              <p id="analysis-requirements" className="mt-1 text-sm text-slate-text/80">Add a photo and a symptom description of at least 5 characters before running the analysis.</p>
            </div>
            <Button
              type="submit"
              loading={busy}
              disabled={!canAnalyze}
              aria-describedby="analysis-requirements"
              className={`min-w-50 gap-2 rounded-xl! px-8 py-3.5 text-sm font-bold uppercase tracking-wider ${!canAnalyze ? "opacity-45" : ""}`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Analyze skin
            </Button>
          </div>
          <div className="mt-6 grid gap-3 border-t border-card-border pt-6 sm:grid-cols-3">
            {[
              { step: "1", t: "Upload a clear photo" },
              { step: "2", t: "Describe symptoms in detail" },
              { step: "3", t: "Review AI guidance calmly" },
            ].map(({ step, t }) => (
              <div key={step} className="rounded-xl bg-page px-4 py-3 text-center text-sm ring-1 ring-card-border">
                <span className="font-bold text-teal">Step {step}</span>
                <p className="mt-1 text-slate-text/70">{t}</p>
              </div>
            ))}
          </div>
        </section>
      </form>
    </div>
  );
}
