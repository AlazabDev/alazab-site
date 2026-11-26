'use strict';
// Configuration/import failures must not become unbounded PM2 restart loops.
try {
  require('./server').start();
} catch (error) {
  console.error('[DAFTRA-MCP][BOOT]', error.stack || error.message);
  process.exitCode = 78;
}
