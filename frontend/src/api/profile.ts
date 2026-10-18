import { api } from "./client";
import type { Profile } from "../types/models";

export async function fetchProfile() {
  const { data } = await api.get<Profile>("/profile/me");
  return data;
}

export async function updateProfile(body: Record<string, unknown>) {
  const { data } = await api.put<Profile>("/profile/me", body);
  return data;
}
