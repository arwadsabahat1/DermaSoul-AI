import axios from "axios";

function formatFieldName(loc: unknown): string | null {
  if (!Array.isArray(loc)) return null;
  const tail = loc[loc.length - 1];
  if (typeof tail !== "string") return null;
  return tail.replace(/_/g, " ");
}

/** Safe message for UI — never throws. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (data?.detail !== undefined) {
      const { detail } = data;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        try {
          return detail
            .map((entry) => {
              if (typeof entry === "object" && entry !== null) {
                const e = entry as { msg?: unknown; loc?: unknown; ctx?: { max_length?: number; le?: number } };
                const field = formatFieldName(e.loc);
                const msg = typeof e.msg === "string" ? e.msg : "";
                if (typeof e.ctx?.max_length === "number") {
                  return field
                    ? `${field} must be ${e.ctx.max_length} characters or fewer.`
                    : `Value must be ${e.ctx.max_length} characters or fewer.`;
                }
                if (typeof e.ctx?.le === "number") {
                  return field ? `${field} must be ${e.ctx.le} or less.` : `Value must be ${e.ctx.le} or less.`;
                }
                if (msg) {
                  return field ? `${field}: ${msg}` : msg;
                }
              }
              return JSON.stringify(entry);
            })
            .filter(Boolean)
            .join("; ");
        } catch {
          return fallback;
        }
      }
    }
    if (error.code === "ERR_NETWORK") {
      return "Network error. Check your connection and that the DermaSoul server is running.";
    }
    if (error.response?.status === 413) {
      return "Upload too large for the server.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
