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
  // Configuración general
  PORT:           asNumber("PORT", process.env, 3000),
  NODE_ENV:        (process.env.NODE_ENV ?? "development"),
  JWT_SECRET:     required("JWT_SECRET", process.env),

  // Base de datos central (Quito)
  CENTRAL_DB_HOST: required("CENTRAL_DB_HOST", process.env),
  CENTRAL_DB_PORT: asNumber("CENTRAL_DB_PORT", process.env, 3306),
  CENTRAL_DB_USER: required("CENTRAL_DB_USER", process.env),
  CENTRAL_DB_PASS: (process.env.CENTRAL_DB_PASS ?? ""),
  CENTRAL_DB_NAME: required("CENTRAL_DB_NAME", process.env),

  // Base de datos Guayaquil
  GYE_DB_HOST:     required("GYE_DB_HOST", process.env),
  GYE_DB_PORT:     asNumber("GYE_DB_PORT", process.env, 3306),
  GYE_DB_USER:     required("GYE_DB_USER", process.env),
  GYE_DB_PASS:     (process.env.GYE_DB_PASS ?? ""),
  GYE_DB_NAME:     required("GYE_DB_NAME", process.env),

  // Base de datos Cuenca
  CUENCA_DB_HOST:  required("CUENCA_DB_HOST", process.env),
  CUENCA_DB_PORT:  asNumber("CUENCA_DB_PORT", process.env, 3306),
  CUENCA_DB_USER:  required("CUENCA_DB_USER", process.env),
  CUENCA_DB_PASS:  (process.env.CUENCA_DB_PASS ?? ""),
  CUENCA_DB_NAME:  required("CUENCA_DB_NAME", process.env),

  // Mantener compatibilidad con configuración anterior
  DB_HOST:        required("CENTRAL_DB_HOST", process.env),
  DB_PORT:        asNumber("CENTRAL_DB_PORT", process.env, 3306),
  DB_USER:        required("CENTRAL_DB_USER", process.env),
  DB_PASS:        (process.env.CENTRAL_DB_PASS ?? ""),
  DB_NAME:        required("CENTRAL_DB_NAME", process.env),
} as const;

// (opcional) log breve de entorno sin secretos
export function logSafeConfig() {
  // No mostramos DB_PASS por seguridad
  // console.log(`[ENV] DB=${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME} | PORT=${CONFIG.PORT}`);
}
