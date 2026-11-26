'use strict';
const path = require('node:path');
try {
  require('dotenv').config({path:path.resolve(__dirname,'../../.env')});
  process.env.OPENAI_MCP_PROFILE='knowledge';
  process.env.OPENAI_MCP_HOST='127.0.0.1';
  process.env.OPENAI_MCP_PORT=process.env.KNOWLEDGE_MCP_PORT||'4018';
  process.env.OPENAI_MCP_PUBLIC_ORIGIN=process.env.KNOWLEDGE_MCP_PUBLIC_ORIGIN||'https://api.alazab.com';
  process.env.OPENAI_MCP_RESOURCE=process.env.KNOWLEDGE_MCP_RESOURCE||process.env.OPENAI_MCP_PUBLIC_ORIGIN.replace(/\/$/,'')+'/knowledge/mcp';
  process.env.OPENAI_MCP_AUTH_MODE=process.env.KNOWLEDGE_MCP_AUTH_MODE||'supabase';
  process.env.OPENAI_MCP_ALLOWED_ROLES=process.env.KNOWLEDGE_MCP_ALLOWED_ROLES||'admin';
  require('../openai/server');
} catch(error) {
  console.error('[KNOWLEDGE-MCP][BOOT]',error.stack||error.message);
  process.exitCode=78;
}
