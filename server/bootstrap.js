'use strict';
try {
  require('./index');
} catch (error) {
  console.error('[API][BOOT]', error.stack || error.message);
  process.exitCode = 78;
}
