import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  Brain,
  CheckCircle2,
  Database,
  Image as ImageIcon,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const PRINCIPLES = [
  {
    icon: Sparkles,
    title: "Educational support",
    text: "The app offers an AI-assisted overview and curated information. It does not confirm what a skin change is.",
  },
  {
    icon: Users,
    title: "Context, when you choose",
    text: "Optional skin-tone and background details can inform inclusive wording; they do not establish equal model performance across groups.",
  },
  {
    icon: Shield,
    title: "Safety before certainty",
    text: "Image checks, symptom-based risk cues, warnings, and clinician referral paths help frame the limits of automated results.",
  },
];

const WORKFLOW = [
  {
    icon: ImageIcon,
    title: "Share an image",
    body: "Upload a skin photo. The app checks basic image quality before running its image models.",
  },
  {
    icon: Activity,
    title: "Add symptom context",
    body: "Describe what you noticed. Rules and optional language processing identify cues such as duration, severity, and possible warning signs.",
  },
  {
    icon: Brain,
    title: "Review a saved overview",
    body: "The app combines model outputs with curated educational guidance, safety notes, and product-support suggestions in a consultation record.",
  },
];

export function AboutPage() {
  const { user } = useAuth();

  return (
    <div className="text-slate-text">
      <section className="relative overflow-hidden border-b border-white/10 bg-linear-to-b from-teal via-teal-strong to-page pb-16 pt-10 text-white md:pb-20 md:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgb(255_255_255/0.12),transparent)]"
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-white/70">Academic project · prototype</p>
          <h1
            className="mt-4 text-4xl font-semibold tracking-tight md:text-[2.75rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Skin analysis support, with limits made clear.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/88 md:text-lg">
            DermaSoul combines skin-image models, symptom context, and curated educational information to help people
            prepare for a conversation with a healthcare professional. It is not a diagnostic service.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/75">
            This academic prototype has not been established as a clinically validated diagnostic tool. Do not use it
            to make treatment decisions or delay professional care.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={user ? "/app/analyze" : "/login"} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-deep shadow-card transition hover:bg-cream-50">
              Explore an analysis <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/conditions" className="inline-flex items-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Browse condition library
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {PRINCIPLES.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-card-border bg-card p-8 text-center shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal text-white shadow-inner">
                <h.icon className="h-6 w-6 opacity-94" aria-hidden strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 text-[17px] font-bold text-teal-deep">{h.title}</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-text/70">{h.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-card-border bg-card py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal">The user journey</p>
            <h2 className="mt-3 text-3xl font-semibold text-teal-deep" style={{ fontFamily: "var(--font-display)" }}>
              What happens in an analysis?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-text/70">
              Each stage contributes information to an educational summary; no single output confirms a diagnosis.
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {WORKFLOW.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="rounded-2xl border border-card-border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 text-teal">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-teal/70">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-teal-deep">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-text/72">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-teal">Under the hood</p>
            <h2 className="mt-3 text-3xl font-semibold text-teal-deep" style={{ fontFamily: "var(--font-display)" }}>
              Built from distinct components
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-text/72">
              The system combines model predictions with user-provided information and reference content. These components
              can be incomplete or wrong, so the result should be treated as a starting point for—not a replacement for—professional care.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-card-border bg-card p-5">
              <h3 className="font-bold text-teal-deep">Image models</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-text/72">
                EfficientNet-based models estimate a skin-condition class and a skin-type category from an uploaded image.
                Results depend on image quality and may be wrong.
              </p>
            </article>
            <article className="rounded-2xl border border-card-border bg-card p-5">
              <h3 className="font-bold text-teal-deep">Symptom and risk cues</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-text/72">
                Rule-based processing identifies selected symptom, severity, urgency, and red-flag cues from the text you provide.
              </p>
            </article>
            <article className="rounded-2xl border border-card-border bg-card p-5 sm:col-span-2">
              <h3 className="font-bold text-teal-deep">Curated guidance—not chat</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-text/72">
                Condition information, follow-up FAQs, and product-support suggestions are assembled from curated content and
                safety rules. The app does not provide a conversational medical AI or prescribe treatment.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-card-border bg-card py-14 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-card-border bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-teal" aria-hidden />
              <h2 className="text-xl font-semibold text-teal-deep">What this tool can—and cannot—do</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-text/75">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />Offer an educational image-and-symptom overview.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />Help organize consultation history and questions for a clinician.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />It cannot confirm or rule out a condition, assess an emergency reliably, or prescribe treatment.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />Its displayed confidence is a model score, not the probability that a person has a disease.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-card-border bg-white p-6 md:p-7">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-teal" aria-hidden />
              <h2 className="text-xl font-semibold text-teal-deep">Images and consultation records</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-text/75">
              An analysis is saved with its image in your consultation history. You can delete a consultation from that
              history; the app also removes its associated uploaded image. Storage and retention depend on the specific
              deployment, so avoid including details that are not needed for an educational assessment.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-text/55">
              This project page is not a substitute for a deployment-specific privacy notice.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="flex items-start gap-3">
          <Users className="mt-1 h-6 w-6 shrink-0 text-teal" aria-hidden strokeWidth={1.8} />
          <div>
            <h2 className="text-2xl font-semibold text-navy" style={{ fontFamily: "var(--font-display)" }}>
              Development team
            </h2>
            <p className="mt-3 text-sm font-bold text-teal-deep">Academic affiliation</p>
            <p className="text-sm text-slate-text/75">
              COMSATS University Islamabad
              <br />
              Bachelor of Science in Computer Science
            </p>
            <p className="mt-6 text-sm font-bold text-teal-deep">Project contributors</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-text/78 marker:text-teal">
              <li>Arwad Rashique</li>
              <li>Abdul Mueed</li>
            </ul>
            <p className="mt-6 text-sm font-bold text-teal-deep">Supervision</p>
            <p className="mt-2 text-sm text-slate-text/78">
              <span className="font-semibold text-slate-text">Supervisor:</span> Amir Shabbir Pare
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-deep to-teal-strong p-8 text-white shadow-xl shadow-teal-deep/25 md:p-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative flex items-start gap-4">
            <Shield className="h-10 w-10 shrink-0 opacity-95" aria-hidden strokeWidth={1.6} />
            <div>
              <h2
                className="text-2xl font-semibold leading-snug md:text-[1.875rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your health comes first
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
                This app provides educational information only. It cannot diagnose or rule out a condition and must not
                delay care. Seek urgent medical help for breathing difficulty, swelling of the face or lips, a rapidly
                spreading rash, severe pain, fever with a rash, widespread blistering or peeling, or significant bleeding.
                If you think you may be having an emergency, contact your local emergency service now.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={user ? "/app/analyze" : "/login"}
                  className="inline-flex items-center gap-3 rounded-xl bg-cream-50 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-teal-deep shadow-card transition hover:bg-white"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Explore an analysis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/conditions"
                  className="inline-flex items-center rounded-xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Browse condition library
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
