import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const standalonePath = new URL('../index.html', import.meta.url);

test('root index is a self-contained non-module standalone game file', async () => {
  const html = await readFile(standalonePath, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const links = [...html.matchAll(/<link\b[^>]*>/gi)];
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => css).join('\n');

  assert.equal(scripts.length, 1, 'expected one bundled inline script');
  assert.doesNotMatch(scripts[0][1], /\bsrc\s*=|type=["']module/i);
  assert.equal(links.length, 1, 'expected only the embedded favicon link');
  assert.match(links[0][0], /\brel="icon"\s+href="data:image\/svg\+xml,/i);
  assert.doesNotMatch(html, /<(?:img|iframe|audio|video|source)\b[^>]*\b(?:src|srcset)\s*=/i);
  assert.doesNotMatch(styles, /@import\b/i);
  for (const [, value] of styles.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    assert.ok(value.trim().startsWith('data:'), `unexpected stylesheet asset reference: ${value}`);
  }
  assert.doesNotMatch(scripts[0][2], /\bfetch\s*\(|\b(?:XMLHttpRequest|WebSocket|EventSource)\b/i);
  assert.match(html, /width="1440"\s+height="810"/);
  assert.ok(html.indexOf('<canvas') < html.indexOf(scripts[0][0]), 'inline game script runs after the canvas markup');
});
