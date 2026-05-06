/**
 * ecosystem.config.js — PM2 process configuration
 * =================================================
 * Run with:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production  (zero-downtime reload)
 */

module.exports = {
  apps: [
    {
      name: 'alazab-api',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // ── Environment ────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3004,
      },

      // ── Logs ───────────────────────────────────────
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,

      // ── Restart policy ─────────────────────────────
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,

      // ── Graceful shutdown ──────────────────────────
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      wait_ready: false,

      // ── Monitoring ─────────────────────────────────
      pmx: true,
    },

    {
      name: 'alazab-mcp',
      script: './mcp/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',

      env_production: {
        NODE_ENV: 'production',
        MCP_PORT: 4005,
      },
      env_development: {
        NODE_ENV: 'development',
        MCP_PORT: 4005,
      },

      error_file: './logs/mcp-error.log',
      out_file: './logs/mcp-out.log',
      log_file: './logs/mcp-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,

      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },
  ],
};
