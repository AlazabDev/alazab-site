'use strict';

const fs = require('fs');
const path = require('path');
const db = require('./db');

async function main() {
  if (!db.dbAvailable) throw new Error('Central webhook database is not configured');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Central webhook schema ready');
  await db.closePool();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
