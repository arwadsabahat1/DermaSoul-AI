import axios from "axios";

const STORAGE_KEY = "dermasoul_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * API base URL:
 * - prod: VITE_API_URL
 * - dev: direct backend URL (default 127.0.0.1:8010) to avoid intermittent Vite proxy 502s
 */
const devApiBaseUrl = (import.meta.env.VITE_DEV_API_URL ?? "http://127.0.0.1:8010").replace(/\/$/, "");
export const apiBaseUrl = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
  : devApiBaseUrl;

/** Default cap so a dead/wrong API host fails fast instead of hanging ~2 minutes. */
const DEFAULT_TIMEOUT_MS = 18_000;

/**
 * Login / session: allow slow Postgres or first connection after DB wake; avoids false
 * "timeout of 18000ms exceeded" while the default client timeout is shorter.
 */
export const AUTH_REQUEST_TIMEOUT_MS = 90_000;

export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
