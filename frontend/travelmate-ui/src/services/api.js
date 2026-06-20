import axios from "axios";
import logger from "../logger";

const CTX = "API";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Purpose: Attach JWT to every outgoing request and log the outgoing call.
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    logger.debug(CTX, `Token attached for request → ${req.method?.toUpperCase()} ${req.url}`);
  } else {
    logger.warn(CTX, `No auth token found for request → ${req.method?.toUpperCase()} ${req.url}`);
  }
  logger.info(CTX, `➡ ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
  return req;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Purpose: Log successful responses and auto-redirect to login on 401.
API.interceptors.response.use(
  (res) => {
    logger.info(CTX, `✅ ${res.status} ${res.config?.method?.toUpperCase()} ${res.config?.url}`);
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url    = err.config?.url;

    if (status === 401) {
      logger.warn(CTX, `401 Unauthorized on ${url} — clearing session and redirecting to login`);
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/";
    } else {
      logger.error(CTX, `❌ HTTP ${status} on ${url}`, err.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

export default API;