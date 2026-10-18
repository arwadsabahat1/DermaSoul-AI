import { api } from "./client";
import type { EducationArticle, EducationArticleSummary, EducationKnowledge } from "../types/models";

export async function fetchArticles(params: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get<EducationArticleSummary[]>("/education", { params });
  return data;
}

export async function fetchArticle(slug: string) {
  const { data } = await api.get<EducationArticle>(`/education/${encodeURIComponent(slug)}`);
  return data;
}

export type EducationMutationInput = {
  title: string;
  slug?: string | null;
  category: string;
  summary?: string | null;
  content: string;
  warnings?: string | null;
  precautions?: string | null;
  when_to_seek_doctor?: string | null;
  source_urls?: string | null;
};

export async function createEducationArticle(payload: EducationMutationInput) {
  const { data } = await api.post<EducationArticle>("/education", payload);
  return data;
}

export async function updateEducationArticle(slug: string, payload: Partial<EducationMutationInput>) {
  const { data } = await api.put<EducationArticle>(`/education/${encodeURIComponent(slug)}`, payload);
  return data;
}

export async function deleteEducationArticle(slug: string) {
  await api.delete(`/education/${encodeURIComponent(slug)}`);
}

export async function fetchArticleKnowledge(slug: string) {
  const { data } = await api.get<EducationKnowledge>(`/education/${encodeURIComponent(slug)}/knowledge`);
  return data;
}
