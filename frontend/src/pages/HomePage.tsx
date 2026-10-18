import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Camera,
  MessageCircleMore,
  Microscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { DETECTABLE_CONDITIONS } from "../constants/detectableConditions";
import { ConditionCoverImage } from "../components/ui/ConditionCoverImage";
import { fetchArticles } from "../api/education";
import type { EducationArticleSummary } from "../types/models";

const STATS = [
  {
    figure: "Multimodal",
    title: "Image + symptom context",
    blurb:
      "Vision models paired with heuristic NLP extraction—not a substitution for biopsy or in-person dermatology.",
  },
  {
    figure: `${DETECTABLE_CONDITIONS.length}+`,
    title: "Model taxonomy breadth",
    blurb:
      "Coarse clinical buckets covering common presentations; probabilities are calibrated for transparency—not certainty.",
  },
  {
    figure: "24/7",
    title: "Asynchronous drafts",
    blurb:
      "Create consultation archives, printable PDF dossiers, and curated OTC education anytime you need clarity.",
  },
];

const ARCH_CARDS = [
  {
    icon: Microscope,
    title: "AI-powered detection helpers",
    text: "CNN classifiers summarize likely categories with calibrated confidence—not definitive diagnosis.",
    shell: "border border-teal/15 bg-teal/[0.05]",
  },
  {
    icon: Sparkles,
    title: "Personalized guidance tone",
    text: "Melanin-aware reasoning, OTC guardrails, and allergy-aware drafts tailored to profile risk notes.",
    shell: "border border-teal/12 bg-teal-strong/10",
  },
  {
    icon: ShieldCheck,
    title: "Accessible orientation",
    text: "Layered disclaimers plus red-flag heuristics to highlight when urgent clinical escalation matters.",
    shell: "border border-card-border bg-page",
  },
];

export function HomePage() {
  const { user } = useAuth();
  const [conditionItems, setConditionItems] = useState<EducationArticleSummary[]>([]);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-40, 40], [6, -6]), { stiffness: 140, damping: 18 });
  const rotY = useSpring(useTransform(tiltX, [-40, 40], [-6, 6]), { stiffness: 140, damping: 18 });

  const ctaAnalyze = user ? "/app/analyze" : "/register";
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchArticles({ limit: 120, offset: 0 });
        if (!cancelled) setConditionItems(rows);
      } catch {
        if (!cancelled) setConditionItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewConditions = useMemo(() => {
    if (conditionItems.length) {
      return [...new Set(conditionItems.map((a) => a.title.trim()).filter(Boolean))].slice(0, 15);
    }
    return DETECTABLE_CONDITIONS.slice(0, 15);
  }, [conditionItems]);

  return (
    <div className="text-slate-text">
      <section className="relative overflow-hidden border-b border-card-border bg-gradient-to-b from-page via-card to-page">
        <motion.div
          aria-hidden
          animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-teal/[0.12] blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -20, 0], y: [0, 14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="pointer-events-none absolute -right-16 top-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center md:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="text-xs font-bold uppercase tracking-[0.42em] text-teal-strong/70">Evidence-minded studio</p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-tight text-slate-text md:text-[2.75rem] md:leading-[1.1]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dermatology-aligned AI scaffolding with conscientious disclosures.
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-slate-text/74">
              A multimodal assistive narrative that connects CNN-derived labels, heuristic symptom parsing, OTC
              knowledge shards, and human-readable dossiers—all while screaming “see a clinician” when prudent.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to={ctaAnalyze}
                className="inline-flex items-center gap-3 rounded-xl bg-teal px-8 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-card transition hover:-translate-y-0.5 hover:bg-teal-strong"
              >
                {user ? "Start analysis" : "Start free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/conditions"
                className="inline-flex rounded-xl border-2 border-card-border bg-card px-6 py-3.5 text-sm font-bold text-teal-strong transition hover:bg-page"
              >
                Browse library
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="relative isolate overflow-hidden rounded-3xl border border-card-border bg-card p-6 shadow-card md:p-8"
            style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              tiltX.set(e.clientX - (rect.left + rect.width / 2));
              tiltY.set(e.clientY - (rect.top + rect.height / 2));
            }}
            onMouseLeave={() => {
              tiltX.set(0);
              tiltY.set(0);
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-10%,rgba(45,106,106,0.18),transparent_54%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-card-border/80 bg-white/70 p-2 shadow-inner">
                {["eczema", "acne", "melasma"].map((slug, i) => (
                  <motion.div
                    key={slug}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="overflow-hidden rounded-xl"
                  >
                    <ConditionCoverImage
                      slug={slug}
                      alt=""
                      className="h-20 w-full object-cover md:h-24"
                      loading="eager"
                    />
                  </motion.div>
                ))}
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-teal/12 bg-teal/[0.04] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal text-white">
                  <Camera className="h-6 w-6" aria-hidden strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-strong/72">Lens first</p>
                  <p className="mt-2 text-[15px] font-semibold text-slate-text">Upload calibrated skin captures</p>
                  <p className="mt-2 text-sm text-slate-text/65">
                    Validates crispness & visible epidermis before models fire—preventing hallucinated diagnoses on junk
                    uploads.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-card-border bg-page p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal/18 bg-card text-teal">
                  <MessageCircleMore className="h-6 w-6" aria-hidden strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-teal-strong/72">Nuanced story</p>
                  <p className="mt-2 text-[15px] font-semibold text-slate-text">Symptom + history harmonization</p>
                  <p className="mt-2 text-sm text-slate-text/65">
                    Duration, aggravators, multilingual cues—all folded into deterministic keyword intelligence.
                  </p>
                </div>
              </div>
              <Link
                to="/about"
                className="text-sm font-semibold text-teal underline-offset-4 transition hover:text-teal-strong hover:underline"
              >
                View architecture manifesto →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-card-border bg-page py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          {STATS.map((s, idx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-card-border bg-card p-8 text-center shadow-card"
            >
              <p className="text-[2.85rem] font-semibold tracking-tighter text-teal md:text-[3.05rem]">{s.figure}</p>
              <p className="mt-3 text-[15px] font-bold text-navy">{s.title}</p>
              <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-slate-text/68">{s.blurb}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture cards */}
      <section className="border-b border-card-border bg-card py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold text-navy md:text-[2.125rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clinical AI architecture
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="mt-4 text-base leading-relaxed text-slate-text/70 md:text-[1.05rem]"
          >
            A multimodal diagnostic-assistance pipeline marrying convolutional classifiers with contextual heuristic
            language reasoning—articulated plainly for auditors, supervisors, and end users alike.
          </motion.p>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-6 px-4 md:grid-cols-3">
          {ARCH_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
                className={`flex gap-5 rounded-[1.375rem] bg-card p-8 shadow-card ${card.shell}`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-teal text-white shadow-inner shadow-black/40">
                  <Icon className="h-7 w-7 opacity-97" aria-hidden strokeWidth={1.7} />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-xl font-semibold tracking-tight text-teal-strong">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-text/71">{card.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Conditions grid */}
      <section className="bg-page py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2
            className="text-3xl font-semibold text-navy md:text-[2.25rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dermatological conditions we structure
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-text/68">
            Admin-updated condition articles appear here automatically. Model prediction labels remain a fixed clinical
            taxonomy for reliability.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-center gap-3 px-4">
          {previewConditions.map((name) => (
            <motion.span
              layout
              key={name}
              whileHover={{ scale: 1.04 }}
              className="rounded-full border border-card-border bg-card px-5 py-2 text-[13px] font-semibold text-teal-strong shadow-sm"
            >
              {name}
            </motion.span>
          ))}
          <span className="rounded-full border border-dashed border-teal/45 px-5 py-2 text-[13px] font-semibold text-teal/90">
            + editorial expansions via library
          </span>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal to-teal-strong py-20 text-center text-white">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-semibold md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Ready to analyze your skin concern?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/88">
            Secure your studio session, narrate what you feel, and export thoughtful PDF primers for your clinician.
          </p>
          <Link
            to={user ? "/app/analyze" : "/register"}
            className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-4 text-sm font-bold uppercase tracking-[0.32em] text-teal-strong shadow-card transition hover:-translate-y-0.5"
          >
            Start free analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
