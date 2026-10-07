import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
let html = await readFile(join(dist, 'dev.html'), 'utf8');

const scriptMatch = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/i);
if (!scriptMatch) throw new Error('Could not find the bundled game script in dist/dev.html.');
const scriptPath = join(dist, scriptMatch[1].replace(/^\.\//, ''));
const script = (await readFile(scriptPath, 'utf8')).replace(/<\/script/gi, '<\\/script');
html = html.replace(scriptMatch[0], '');

for (const match of [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*\/?\s*>/gi)]) {
  const cssPath = join(dist, match[1].replace(/^\.\//, ''));
  const css = await readFile(cssPath, 'utf8');
  html = html.replace(match[0], `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
}
html = html.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/gi, '');
html = html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/gi, '');
html = html.replace(/<link\b[^>]*\bhref="(?:\.\/)?assets\/[^"]+"[^>]*>/gi, '');

const inlineScript = `<script>${script}</script>`;
html = html.replace('</body>', `${inlineScript}\n  </body>`);
html = html.replace(/[ \t]+$/gm, '');
if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw new Error('Standalone output still references an external script.');
if (/<(?:img|iframe|audio|video|source)\b[^>]*\b(?:src|srcset)\s*=/i.test(html)) {
  throw new Error('Standalone output still references an external media asset.');
}
const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag);
if (linkTags.length !== 1 || !/\brel="icon"\s+href="data:image\/svg\+xml,/i.test(linkTags[0])) {
  throw new Error('Standalone output must use only its embedded favicon link.');
}
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, css]) => css).join('\n');
if (/@import\b/i.test(styles)) throw new Error('Standalone styles must not import external stylesheets.');
for (const [, value] of styles.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
  if (!value.trim().startsWith('data:')) throw new Error('Standalone styles must not request external assets.');
}
if (/\bfetch\s*\(|\b(?:XMLHttpRequest|WebSocket|EventSource)\b/i.test(script)) {
  throw new Error('Standalone game bundle must not make network requests.');
}
if (/<script\b[^>]*type="module"/i.test(html)) throw new Error('Standalone output must not require ES modules.');

await writeFile(join(root, 'index.html'), html);
await copyFile(join(root, 'index.html'), join(dist, 'index.html'));
console.log('Wrote self-contained root index.html and dist/index.html.');
