// src/lib/logger.ts

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/** Strips sensitive fields before logging */
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    "apiKey", "api_key", "token", "password", "secret",
    "authorization", "cookie", "ANTHROPIC_API_KEY", "VERCEL_TOKEN",
  ]);
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      cleaned[key] = sanitize(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitize(meta),
  };

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") log("debug", msg, meta);
  },
};
