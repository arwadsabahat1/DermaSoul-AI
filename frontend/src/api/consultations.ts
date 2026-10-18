import { api } from "./client";
import type { ConsultationDetail, ConsultationPaginated } from "../types/models";

export async function fetchConsultations(limit: number, offset: number) {
  const { data } = await api.get<ConsultationPaginated>("/consultations", {
    params: { limit, offset },
  });
  return data;
}

export async function fetchConsultation(id: string) {
  const { data } = await api.get<ConsultationDetail>(`/consultations/${id}`);
  return data;
}

export async function deleteConsultation(id: string) {
  await api.delete(`/consultations/${id}`);
}

export async function downloadConsultationPdf(id: string, filename: string) {
  const { data } = await api.get(`/consultations/${id}/download-pdf`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fetchConsultationImageBlob(id: string): Promise<string | null> {
  try {
    const { data } = await api.get(`/consultations/${id}/image`, {
      responseType: "blob",
    });
    return URL.createObjectURL(data);
  } catch {
    return null;
  }
}
