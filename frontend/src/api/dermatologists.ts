import { api } from "./client";
import type { Dermatologist } from "../types/models";

export async function fetchDermatologists(includeInactive = false) {
  const { data } = await api.get<Dermatologist[]>("/dermatologists", {
    params: { include_inactive: includeInactive || undefined },
  });
  return data;
}

export type DermatologistMutationInput = Omit<Dermatologist, "id" | "created_at" | "updated_at">;

export async function createDermatologist(payload: DermatologistMutationInput) {
  const { data } = await api.post<Dermatologist>("/dermatologists", payload);
  return data;
}

export async function updateDermatologist(id: string, payload: Partial<DermatologistMutationInput>) {
  const { data } = await api.put<Dermatologist>(`/dermatologists/${id}`, payload);
  return data;
}

export async function deleteDermatologist(id: string) {
  await api.delete(`/dermatologists/${id}`);
}
