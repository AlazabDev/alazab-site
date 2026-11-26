'use strict';
const path = require('node:path');
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});
process.env.DAFTRA_OPENAPI_STRICT_HASH = 'true';
try {
  const { catalogSummary } = require('./registry');
  console.log(JSON.stringify(catalogSummary, null, 2));
} catch (error) {
  console.error('[DAFTRA-MCP][CONFIG]', error.message);
  process.exitCode = 78;
}
