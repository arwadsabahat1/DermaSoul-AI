import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { fetchConsultation } from "../api/consultations";
import type { ConsultationDetail } from "../types/models";
import { getFaqsForDiagnosedCondition } from "../lib/conditionFaqs";
import { GlassCard } from "../components/ui/GlassCard";
import { getApiErrorMessage } from "../lib/errors";

/** FAQ follow-up content for this consultation — replaces the old LLM chat. */
export function ConsultationFaqPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const faq = useMemo(() => {
    const disease =
      typeof c?.predicted_disease === "string" ? (c.predicted_disease as string) : "";
    return getFaqsForDiagnosedCondition(disease);
  }, [c?.predicted_disease]);

  if (!id || loading || !c) {
    return (
      <div className="mx-auto max-w-4xl pb-12">
        <p className="text-sm text-forest-900/55">Loading FAQs…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/app/consultations/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-sage-700 hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to consultation
        </Link>
      </div>

      <GlassCard className="p-5">
        <h1
          className="text-2xl text-forest-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Frequently asked questions
        </h1>
        <p className="mt-2 text-sm text-forest-900/65">
          Curated FAQs for{" "}
          <span className="font-semibold text-forest-900">{faq.predictedLabel}</span>, based on the
          same condition reference used elsewhere in your report. Answers are deterministic—there is{" "}
          <span className="font-medium text-forest-900">no conversational AI</span> in this section.
        </p>
        {!faq.matchedKnowledge ? (
          <p className="mt-2 text-xs text-amber-900/75">
            No curated knowledge row matched “{faq.predictedLabel}”—showing generalized safe-guidance FAQs.
          </p>
        ) : null}
      </GlassCard>

      {(c.llm_followup_questions?.length || c.followup_candidates?.length) ? (
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-forest-900">Useful questions for follow-up</h2>
          <p className="mt-1 text-sm text-forest-900/65">
            These prompts can help you describe changes or prepare for a clinician visit. They are not a diagnosis.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-forest-900/80">
            {[...(c.llm_followup_questions ?? []), ...(c.followup_candidates ?? [])]
              .filter((question, index, all) => question.trim() && all.indexOf(question) === index)
              .map((question) => <li key={question}>{question}</li>)}
          </ul>
          <Link
            to="/app/doctors"
            className="mt-4 inline-flex rounded-xl border border-card-border bg-white/70 px-4 py-2 text-sm font-semibold text-teal-deep hover:border-teal/30"
          >
            Browse dermatologist directory
          </Link>
        </GlassCard>
      ) : null}

      <div className="space-y-3">
        {faq.items.map((item) => (
          <GlassCard key={item.question} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-deep/80">
              Question
            </p>
            <p className="mt-1 text-base font-medium text-forest-900">{item.question}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-forest-900/82">
              {item.answer}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
