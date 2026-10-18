import { CONDITION_KNOWLEDGE_FE, type ConditionKnowledgeFE } from "../constants/conditionKnowledgeData";

export type ConditionFaqItem = { question: string; answer: string };

function joinBullets(rows: string[] | undefined, max = 8): string {
  const list = rows?.filter(Boolean).slice(0, max) ?? [];
  return list.map((line) => `• ${line}`).join("\n");
}

/** Case-insensitive match on stored model prediction vs curated knowledge rows. */
function findKnowledgeRow(predictedDisease: string): ConditionKnowledgeFE | undefined {
  const raw = predictedDisease?.trim() ?? "";
  if (!raw) return CONDITION_KNOWLEDGE_FE.find((k) => k.model_class === "Unknown/Normal");
  const lowered = raw.toLowerCase();
  return CONDITION_KNOWLEDGE_FE.find(
    (k) => k.model_class === raw || k.model_class.toLowerCase() === lowered || k.condition_name.toLowerCase() === lowered,
  );
}

/** Four FAQs per diagnosed condition — content comes from curated knowledge already used elsewhere. */
export function getFaqsForDiagnosedCondition(predictedDisease: string): {
  predictedLabel: string;
  matchedKnowledge: ConditionKnowledgeFE | null;
  items: ConditionFaqItem[];
} {
  const row = findKnowledgeRow(predictedDisease);
  const fallback = CONDITION_KNOWLEDGE_FE.find((k) => k.model_class === "Unknown/Normal");
  const k = row ?? fallback!;
  const label = predictedDisease?.trim() || k.condition_name;

  const edu =
    "This information is educational only. It does not confirm a diagnosis and is not individualized medical advice. " +
    "See a licensed clinician—especially dermatology—for examination, prescriptions, biopsies, or procedures.";

  const items: ConditionFaqItem[] = [
    {
      question: `What does "${label}" refer to here?`,
      answer: `${k.brief_overview}\n\n${edu}`,
    },
    {
      question: "What self-care approaches are commonly reasonable?",
      answer:
        `${joinBullets(k.general_care_guidance) || "Your consultation report already summarizes care guidance."}\n\n` +
        edu,
    },
    {
      question: "What should I generally avoid?",
      answer: `${joinBullets(k.what_to_avoid)}\n\n${edu}`,
    },
    {
      question: "When should I prioritize an in-person visit?",
      answer: `${k.when_to_seek_doctor}\n\n${joinBullets(k.red_flags, 6)}\n\n${k.professional_note}\n\n${edu}`,
    },
  ];

  return {
    predictedLabel: label,
    matchedKnowledge: row ?? null,
    items,
  };
}
