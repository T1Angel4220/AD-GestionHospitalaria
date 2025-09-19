// src/config/db.ts
import mysql from "mysql2/promise";
import { CONFIG } from "./env";

export const pool = mysql.createPool({
  host: CONFIG.DB_HOST,
  port: CONFIG.DB_PORT,
  user: CONFIG.DB_USER,
  password: CONFIG.DB_PASS,
  database: CONFIG.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDB(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

/** Helper genérico para consultas tipadas */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.query(sql, params ?? []);
  return rows as T[];
}

/** Cierre limpio del pool en señales del proceso */
async function shutdown() {
  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
