# Alazab Knowledge MCP

Dedicated MCP process, using the existing OpenAI MCP transport and Supabase OAuth implementation.
Default endpoint: https://api.alazab.com/knowledge/mcp (only after Nginx and OAuth validation).
Port 4018, loopback only. Default role: admin. Do not set auth mode none in production.
The root defaults to the repository public/az folder; set AZ_KNOWLEDGE_ROOT to the canonical live folder if releases use a separate directory.

Tools: knowledge_context, knowledge_list, knowledge_read, search, fetch. Text is paginated; binary files are listed but not decoded. Symlinks and hidden paths are rejected.
Optional knowledge_save_session is enabled only with AZ_KNOWLEDGE_WRITE_ENABLED=true.
It writes history and latest.md under sessions, never arbitrary paths. Summaries must be safe for the public web directory.

## Deployment

1. Confirm no existing MCP owns the intended endpoint; inspect the existing alazab-kb.service on the host. Do not stop it until the replacement is tested.
2. Install locked server dependencies using npm ci. Run npm run mcp:knowledge:test and existing OpenAI smoke test.
3. Confirm the existing Supabase OAuth issuer can issue access tokens with the exact resource audience https://api.alazab.com/knowledge/mcp and the admin role. No new OAuth provider is created.
4. Start only the knowledge process: pm2 start ecosystem.config.js --only alazab-knowledge-mcp --env production
5. Check http://127.0.0.1:4018/health. Include api-alazab-knowledge-mcp.locations.conf in the existing API TLS vhost, run nginx -t, then reload.
6. Validate OAuth discovery, reject unauthorized tool calls, and use a real admin OAuth token to call knowledge_context before connecting ChatGPT.
7. Enable writes only after verifying the intended filesystem is writable and HTTP publication does not disclose confidential data. If the site serves a separate dist directory, the MCP writes the source tree; publication requires the existing deployment mechanism or a separately reviewed narrow alias. Do not expose raw business data by adding a broad public alias.

The existing alazab-openai-mcp operations profile remains unchanged in tool names. No filesystem service is started by this commit.
