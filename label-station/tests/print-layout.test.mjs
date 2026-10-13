import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('Letter 4-up print geometry fills four equal sheet quadrants', () => {
  assert.match(css, /@page\s*\{\s*size:Letter portrait;\s*margin:0;/);
  assert.match(css, /\.print-profile-avery \.print-page \{[^}]*width:8\.5in;[^}]*height:11in;[^}]*padding:0;[^}]*grid-template-columns:4\.25in 4\.25in;[^}]*grid-template-rows:5\.5in 5\.5in;[^}]*gap:0;/);
  assert.match(css, /\.print-profile-avery \.print-page \.label-card \{[^}]*width:4\.25in;[^}]*height:5\.5in;/);
});
