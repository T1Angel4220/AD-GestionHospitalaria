// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();

type Raw = NodeJS.ProcessEnv;

function required(name: keyof Raw, raw: Raw): string {
  const val = raw[name];
  if (val === undefined || val === null || String(val).trim() === "") {
    throw new Error(`[ENV] Falta configurar ${String(name)} en .env`);
  }
  return String(val);
}

function asNumber(name: keyof Raw, raw: Raw, def?: number): number {
  const txt = raw[name];
  if (txt === undefined || txt === null || String(txt).trim() === "") {
    if (def !== undefined) return def;
    throw new Error(`[ENV] Falta número para ${String(name)}`);
  }
  const n = Number(txt);
  if (!Number.isFinite(n)) {
    throw new Error(`[ENV] ${String(name)} debe ser numérico (valor: "${txt}")`);
  }
  return n;
}

// Construir la config validada una sola vez
export const CONFIG = {
  DB_HOST:        required("DB_HOST", process.env),
  DB_PORT:        asNumber("DB_PORT", process.env, 3306),
  DB_USER:        required("DB_USER", process.env),
  DB_PASS:        (process.env.DB_PASS ?? ""),    // puede ser vacío
  DB_NAME:        required("DB_NAME", process.env),

  PORT:           asNumber("PORT", process.env, 4000),
  JWT_SECRET:     required("JWT_SECRET", process.env),
} as const;

// (opcional) log breve de entorno sin secretos
export function logSafeConfig() {
  // No mostramos DB_PASS por seguridad
  // console.log(`[ENV] DB=${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME} | PORT=${CONFIG.PORT}`);
}
