'use strict';

const axios = require('axios');
const FormData = require('form-data');

let cached = null;

function env(...names) {
  for (const name of names) if (process.env[name]) return process.env[name];
  return undefined;
}

function oauthConfig() {
  return {
    url: env('DAFTRA_OAUTH_URL'),
    clientId: env('DAFTRA_OAUTH_CLIENT_ID'),
    clientSecret: env('DAFTRA_OAUTH_CLIENT_SECRET'),
    username: env('DAFTRA_OAUTH_USERNAME'),
    password: env('DAFTRA_OAUTH_PASSWORD'),
    refreshToken: env('DAFTRA_OAUTH_REFRESH_TOKEN'),
    scope: env('DAFTRA_OAUTH_SCOPE') || '',
  };
}

async function requestToken() {
  const cfg = oauthConfig();
  if (!cfg.url || !cfg.clientId || !cfg.clientSecret) return null;

  const form = new FormData();
  if (cfg.refreshToken) {
    form.append('grant_type', 'refresh_token');
    form.append('client_id', cfg.clientId);
    form.append('client_secret', cfg.clientSecret);
    form.append('refresh_token', cfg.refreshToken);
  } else if (cfg.username && cfg.password) {
    form.append('grant_type', 'password');
    form.append('client_id', cfg.clientId);
    form.append('client_secret', cfg.clientSecret);
    form.append('username', cfg.username);
    form.append('password', cfg.password);
    form.append('scope', cfg.scope);
  } else {
    return null;
  }

  const response = await axios.post(cfg.url, form, {
    headers: { Accept: 'application/json', ...form.getHeaders() },
    timeout: Number(process.env.MCP_DAFTRA_TIMEOUT_MS || 60000),
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300 || !response.data?.access_token) {
    throw new Error(`Daftra OAuth failed (${response.status}): ${JSON.stringify(response.data)}`);
  }

  const expiresIn = Number(response.data.expires_in || 3600);
  cached = {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token || cfg.refreshToken,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000,
  };
  return cached.accessToken;
}

async function getAuthHeaders() {
  const headers = {};
  if (process.env.DAFTRA_API_KEY) headers.apikey = process.env.DAFTRA_API_KEY;

  if (process.env.DAFTRA_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DAFTRA_ACCESS_TOKEN}`;
    return headers;
  }

  if (cached?.accessToken && cached.expiresAt > Date.now()) {
    headers.Authorization = `Bearer ${cached.accessToken}`;
    return headers;
  }

  const token = await requestToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (Object.keys(headers).length) return headers;

  throw new Error('Daftra authentication is not configured. Set DAFTRA_ACCESS_TOKEN, OAuth settings, or DAFTRA_API_KEY.');
}

module.exports = { getAuthHeaders, requestToken };
