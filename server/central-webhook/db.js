'use strict';

const { Pool } = require('pg');

const connectionString = process.env.CENTRAL_DATABASE_URL || process.env.DATABASE_URL;
const hasFields = Boolean(
  (process.env.PG_HOST || process.env.DB_HOST) &&
  (process.env.PG_DATABASE || process.env.DB_NAME) &&
  (process.env.PG_USER || process.env.DB_USER) &&
  (process.env.PG_PASSWORD || process.env.DB_PASSWORD)
);

const ssl = process.env.CENTRAL_DB_SSL === 'true'
  ? { rejectUnauthorized: process.env.CENTRAL_DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : false;

let pool = null;
if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.CENTRAL_DB_POOL_MAX || 5),
    connectionTimeoutMillis: Number(process.env.CENTRAL_DB_CONNECT_TIMEOUT_MS || 5000),
    idleTimeoutMillis: 30000,
    application_name: 'alazab-central-webhook',
  });
} else if (hasFields) {
  pool = new Pool({
    host: process.env.PG_HOST || process.env.DB_HOST,
    port: Number(process.env.PG_PORT || process.env.DB_PORT || 5432),
    database: process.env.PG_DATABASE || process.env.DB_NAME,
    user: process.env.PG_USER || process.env.DB_USER,
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
    ssl,
    max: Number(process.env.CENTRAL_DB_POOL_MAX || 5),
    connectionTimeoutMillis: Number(process.env.CENTRAL_DB_CONNECT_TIMEOUT_MS || 5000),
    idleTimeoutMillis: 30000,
    application_name: 'alazab-central-webhook',
  });
}

if (pool) {
  pool.on('error', (error) => console.error('[central-webhook][db]', error.message));
}

async function query(text, params = []) {
  if (!pool) throw new Error('Central webhook database is not configured');
  return pool.query(text, params);
}

async function closePool() {
  if (pool) await pool.end();
}

module.exports = { pool, query, closePool, dbAvailable: Boolean(pool) };
