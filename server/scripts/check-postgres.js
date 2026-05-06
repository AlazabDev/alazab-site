'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false,
  connectionTimeoutMillis: 5000,
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS now,
        current_database() AS database,
        current_user AS user,
        version() AS version
    `);

    console.log('✅ PostgreSQL connected');
    console.log(JSON.stringify(result.rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ PostgreSQL failed');
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
})();
