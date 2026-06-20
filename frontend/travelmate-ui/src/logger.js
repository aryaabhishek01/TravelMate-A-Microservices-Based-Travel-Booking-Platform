// ─────────────────────────────────────────────────────────────────────────────
// TravelMate Frontend Logger Utility
// Purpose: Centralised logging for the React app.
//          - Uses log levels: DEBUG, INFO, WARN, ERROR
//          - In production (NODE_ENV=production) DEBUG/INFO are suppressed
//          - Each log is prefixed with a timestamp + level tag
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

// In production only show WARN and above
const MIN_LEVEL =
  process.env.NODE_ENV === "production" ? LEVELS.WARN : LEVELS.DEBUG;

const STYLES = {
  DEBUG: "color:#6c757d;font-weight:bold",
  INFO:  "color:#0d6efd;font-weight:bold",
  WARN:  "color:#fd7e14;font-weight:bold",
  ERROR: "color:#dc3545;font-weight:bold",
};

function timestamp() {
  return new Date().toISOString();
}

function log(level, context, message, ...data) {
  if (LEVELS[level] < MIN_LEVEL) return;

  const prefix = `[${timestamp()}] [${level}] [${context}]`;

  switch (level) {
    case "ERROR":
      console.error(`%c${prefix}`, STYLES[level], message, ...data);
      break;
    case "WARN":
      console.warn(`%c${prefix}`, STYLES[level], message, ...data);
      break;
    default:
      console.log(`%c${prefix}`, STYLES[level], message, ...data);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
const logger = {
  /**
   * Fine-grained tracing — suppressed in production.
   * Use for: component renders, state values, verbose traces.
   */
  debug: (context, message, ...data) => log("DEBUG", context, message, ...data),

  /**
   * General operational messages — suppressed in production.
   * Use for: API calls initiated, user actions, navigation events.
   */
  info: (context, message, ...data) => log("INFO", context, message, ...data),

  /**
   * Potentially harmful situations — shown in production.
   * Use for: unexpected but recoverable states, deprecated usage.
   */
  warn: (context, message, ...data) => log("WARN", context, message, ...data),

  /**
   * Error events — always shown.
   * Use for: failed API calls, caught exceptions, auth failures.
   */
  error: (context, message, ...data) => log("ERROR", context, message, ...data),
};

export default logger;
