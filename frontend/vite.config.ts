import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Proxies /api → backend. Prefer `frontend/.env.development.local`:
 *   VITE_DEV_PROXY_TARGET=http://127.0.0.1:8010
 * Default 8010 avoids Windows WinError 10013 on port 8000 for some setups.
 */
const apiProxyTarget =
  process.env.VITE_DEV_PROXY_TARGET ?? "http://127.0.0.1:8010";

const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: true,
    // Local LLM can exceed default proxy timeouts; otherwise Vite returns 502 while Axios waits.
    timeout: 0,
    proxyTimeout: 0,
    // Avoid flaky keep-alive to uvicorn (intermittent ECONNRESET → browser sees 502 while logs show 200).
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader("Connection", "close");
      });
    },
  },
} as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { ...apiProxy },
  },
  preview: {
    port: 4173,
    proxy: { ...apiProxy },
  },
});
