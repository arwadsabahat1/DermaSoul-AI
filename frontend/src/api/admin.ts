import { api } from "./client";
import type { ConsultationDetail, ConsultationPaginated, Product, User } from "../types/models";

export type AdminStats = {
  total_users: number;
  active_users: number;
  disabled_users: number;
  total_consultations: number;
  high_risk_consultations: number;
  consultations_by_risk: Record<string, number>;
};

export type AdminUserSummary = Pick<User, "id" | "email" | "role" | "is_active"> & {
  created_at: string;
};

export type AdminFlaggedConsultation = {
  id: string;
  user_id: string;
  predicted_disease: string;
  risk_level: string;
  doctor_warning: string;
  created_at: string;
};

export type AdminConsultationDetail = ConsultationDetail & {
  user_email: string;
};

export async function fetchAdminStats() {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function fetchAdminUsers(params: { search?: string; limit?: number; offset?: number }) {
  const { data } = await api.get<AdminUserSummary[]>("/admin/users", { params });
  return data;
}

export async function setAdminUserStatus(userId: string, isActive: boolean) {
  const { data } = await api.patch<AdminUserSummary>(`/admin/users/${userId}/status`, null, {
    params: { is_active: isActive },
  });
  return data;
}

export async function fetchAdminUserConsultations(userId: string, limit = 20, offset = 0) {
  const { data } = await api.get<ConsultationPaginated>(`/admin/users/${userId}/consultations`, {
    params: { limit, offset },
  });
  return data;
}

export async function fetchAdminFlaggedConsultations(riskLevel = "High", limit = 50) {
  const { data } = await api.get<AdminFlaggedConsultation[]>("/admin/consultations/flagged", {
    params: { risk_level: riskLevel, limit },
  });
  return data;
}

export async function fetchAdminConsultationDetail(id: string) {
  const { data } = await api.get<AdminConsultationDetail>(`/admin/consultations/${id}`);
  return data;
}

export type ProductMutationInput = Omit<Product, "id" | "created_at">;

export async function createAdminProduct(payload: ProductMutationInput) {
  const { data } = await api.post<Product>("/products", payload);
  return data;
}

export async function updateAdminProduct(id: string, payload: Partial<ProductMutationInput>) {
  const { data } = await api.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteAdminProduct(id: string) {
  await api.delete(`/products/${id}`);
}
