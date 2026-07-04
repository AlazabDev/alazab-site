require('dotenv').config();

const { Pool } = require('pg');

const config = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: Number(process.env.PG_PORT || 5433),
  database: process.env.PG_DATABASE || 'azab_hooks',
  user: process.env.PG_USER || 'azab_hooks',
  password: process.env.PG_PASSWORD,
  connectionTimeoutMillis: 10000,
};

async function main() {
  const masked = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? '***set***' : '***missing***',
  };

  console.log('PostgreSQL config:', masked);

  if (!config.password) {
    throw new Error('PG_PASSWORD is missing from .env');
  }

  const pool = new Pool(config);

  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        inet_server_addr() AS server_addr,
        inet_server_port() AS server_port,
        now() AS checked_at
    `);

    console.log('✅ PostgreSQL connected');
    console.log(result.rows[0]);

    const tables = await pool.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname = 'wa_ingest'
      ORDER BY tablename
    `);

    console.log('wa_ingest tables:', tables.rows.map(r => r.tablename));
  } catch (err) {
    console.error('❌ PostgreSQL failed');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
