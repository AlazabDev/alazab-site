/**
 * db.js — PostgreSQL connection pool
 * ====================================
 * Supports optional DB: if env vars are missing the module loads
 * without throwing, and query() rejects with a clear error at call time.
 */

'use strict';

const { Pool } = require('pg');
require('dotenv').config();


const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);

let pool = null;
let dbAvailable = false;

if (missingEnv.length === 0) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX || 20),
    min: Number(process.env.DB_POOL_MIN || 2),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
    maxUses: Number(process.env.DB_MAX_USES || 7500),
    allowExitOnIdle: false,
    application_name: process.env.DB_APP_NAME || 'alazab-api',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : false,
  });

  pool.on('connect', async (client) => {
    try {
      await client.query(`
        SET statement_timeout TO '15s';
        SET idle_in_transaction_session_timeout TO '10s';
        SET TIME ZONE 'UTC';
      `);
    } catch (err) {
      console.warn('⚠️ PostgreSQL session setup warning:', {
        message: err.message,
        code: err.code,
      });
    }
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', { message: err.message, code: err.code });
  });

  dbAvailable = true;
} else {
  console.warn(
    `DB not configured — missing: ${missingEnv.join(', ')}. Database features disabled.`
  );
}

async function testDbConnection() {
  if (!pool) return { ok: false, reason: 'DB not configured' };
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT NOW() AS now, current_database() AS db, current_user AS "user"'
    );
    console.log('PostgreSQL connected:', result.rows[0]);
    return { ok: true, ...result.rows[0] };
  } finally {
    client.release();
  }
}

async function query(text, params = []) {
  if (!pool) throw new Error('Database not available — check DB_* environment variables');
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('Slow query detected', { duration_ms: duration, query: text });
    }
    return result;
  } catch (err) {
    console.error('Query error:', { message: err.message, code: err.code, query: text });
    throw err;
  }
}

async function getClient() {
  if (!pool) throw new Error('Database not available — check DB_* environment variables');
  return pool.connect();
}

async function closePool() {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL pool closed');
  }
}

module.exports = { pool, query, getClient, testDbConnection, closePool, dbAvailable };
