import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const app = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
const content = readFileSync(resolve(root, 'src/data/content.js'), 'utf8');

test('all expected public routes are registered', () => {
  for (const route of ['/', '/about', '/events', '/events/:id', '/team', '/gallery', '/get-involved', '*']) {
    assert.ok(app.includes(`path="${route}"`), `Missing route ${route}`);
  }
});

test('header exposes the main pages and volunteer call-to-action', () => {
  for (const entry of ["['Home','/']", "['About','/about']", "['Events','/events']", "['Our Team','/team']", "['Gallery','/gallery']", 'to="/get-involved"']) {
    assert.ok(app.includes(entry), `Missing navigation entry ${entry}`);
  }
});

test('society and university logos exist', () => {
  for (const file of ['public/images/branding/society-logo.webp', 'public/images/branding/university-logo.webp']) {
    assert.ok(existsSync(resolve(root, file)), `Missing ${file}`);
  }
});

test('all literal image references resolve to files', () => {
  const refs = new Set((app + content).match(/\/images\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp)/g) ?? []);
  assert.ok(refs.size > 0, 'No image references found');
  for (const ref of refs) assert.ok(existsSync(resolve(root, 'public', ref.slice(1))), `Missing ${ref}`);
});

test('content IDs are unique', () => {
  const ids = [...content.matchAll(/\{id:'([^']+)'/g)].map(m => m[1]);
  assert.ok(ids.length > 0, 'No content IDs found');
  assert.equal(new Set(ids).size, ids.length, 'Duplicate event/initiative IDs found');
});

test('committee contains the expected main-panel roles', () => {
  for (const role of ['President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Secretary Events', 'Secretary Finance', 'Secretary Media Management', 'Secretary Media Covering']) {
    assert.ok(content.includes(`role:'${role}'`), `Missing committee role ${role}`);
  }
});

test('team note says Deputy Directors', () => {
  assert.ok(app.includes('8 Directors and 8 Deputy Directors'));
  assert.ok(!app.includes('8 Directors and 8 Department Directors'));
  const readme = readFileSync(resolve(root, 'README-UPDATE.txt'), 'utf8');
  assert.ok(readme.includes('8 Directors and 8 Deputy Directors'));
  assert.ok(!readme.includes('8 Department Directors'));
});

test('volunteer contact information is labelled as temporary', () => {
  assert.ok(app.includes('https://www.instagram.com/mcscommunityservice/'));
  assert.ok(app.includes('+92 300 000 0000'));
  assert.ok(app.includes('Temporary reference number'));
});

test('events page combines events with the remaining initiative entries', () => {
  assert.ok(app.includes('...events'));
  assert.ok(app.includes("['ramzan-ration','orphanage','old-age-home']"));
});
