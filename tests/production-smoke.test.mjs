import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('critical routes point to real pages', () => {
  const app = read('src/App.tsx');
  assert.match(app, /path="\/search"/);
  assert.match(app, /path="\/messages"/);
  assert.match(app, /GeneralSuppliesPage/);
  assert.match(app, /MaintenanceRenovationPage/);
  assert.match(app, /LuxuryCleaningPage/);
});

test('project files use persistent storage', () => {
  const hook = read('src/hooks/useProject.ts');
  const upload = read('src/components/project/ProjectFileUpload.tsx');
  assert.match(hook, /from\('project_files'\)/);
  assert.match(upload, /from\('project-files'\)/);
  assert.match(upload, /projectId}\/\$\{user\.id\}/);
  assert.doesNotMatch(hook, /TODO:/);
  assert.doesNotMatch(upload, /TODO:/);
});

test('generated build and backup trees are not tracked', () => {
  assert.equal(existsSync(new URL('../dist.next', import.meta.url)), false);
  assert.equal(existsSync(new URL('../supabase/migrations-bak', import.meta.url)), false);
});
