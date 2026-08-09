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

    {
      // Standards-compliant MCP endpoint for ChatGPT Plugins / Codex.
      // It is deliberately isolated from the legacy gateway on :4005 so
      // existing callers keep working while /mcp can move to this process.
      name: 'alazab-openai-mcp',
      script: './mcp/openai/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',

      env_production: {
        NODE_ENV: 'production',
        OPENAI_MCP_HOST: '127.0.0.1',
        OPENAI_MCP_PORT: 4015,
        OPENAI_MCP_PUBLIC_ORIGIN: 'https://api.alazab.com',
        OPENAI_MCP_RESOURCE: 'https://api.alazab.com',
        OPENAI_MCP_INTERNAL_GATEWAY_URL: 'http://127.0.0.1:4005/call',
        OPENAI_MCP_AUTH_MODE: 'supabase',
      },
      env_development: {
        NODE_ENV: 'development',
        OPENAI_MCP_HOST: '127.0.0.1',
        OPENAI_MCP_PORT: 4015,
        OPENAI_MCP_PUBLIC_ORIGIN: 'https://api.alazab.com',
        OPENAI_MCP_RESOURCE: 'https://api.alazab.com',
        OPENAI_MCP_INTERNAL_GATEWAY_URL: 'http://127.0.0.1:4005/call',
        OPENAI_MCP_AUTH_MODE: 'none',
      },

      error_file: './logs/openai-mcp-error.log',
      out_file: './logs/openai-mcp-out.log',
      log_file: './logs/openai-mcp-combined.log',
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
