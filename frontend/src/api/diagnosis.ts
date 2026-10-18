import { api } from "./client";
import type { DiagnosisResponse } from "../types/models";

export async function analyzeDiagnosis(formData: FormData) {
  const { data } = await api.post<DiagnosisResponse>("/diagnosis/analyze", formData, {
    timeout: 120_000,
    maxContentLength: 25 * 1024 * 1024,
    maxBodyLength: 25 * 1024 * 1024,
  });
  return data;
}
