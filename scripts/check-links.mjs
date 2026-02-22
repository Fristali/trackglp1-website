#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const htmlFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.name === 'templates' ||
      entry.name === 'scripts' ||
      entry.name === 'content'
    ) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
}

walk(root);

const hrefRe = /href\s*=\s*"([^"]+)"/gi;
const internalErrors = [];
const externalLinks = new Set();

const normalizeLocalPath = (ref, filePath) => {
  const [clean] = ref.split('#');
  const [target] = clean.split('?');
  if (!target || target === '') return null;
  if (target.startsWith('/')) return path.join(root, target);
  return path.resolve(path.dirname(filePath), target);
};

for (const filePath of htmlFiles) {
  const html = fs.readFileSync(filePath, 'utf8');
  const refs = html.matchAll(hrefRe);

  for (const match of refs) {
    const ref = match[1].trim();
    if (!ref || ref.startsWith('#') || ref.includes('${') || ref.includes('{{')) {
      continue;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) {
      if (/^https?:\/\//i.test(ref)) {
        externalLinks.add(ref);
      }
      continue;
    }

    const localTarget = normalizeLocalPath(ref, filePath);
    if (!localTarget) continue;

    if (!fs.existsSync(localTarget)) {
      internalErrors.push(`${path.relative(root, filePath)} -> ${ref}`);
    }
  }
}

console.log(`Scanned ${htmlFiles.length} HTML files.`);

if (internalErrors.length > 0) {
  console.error('Broken internal links detected:');
  for (const err of internalErrors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('Internal link check passed.');

const EXTERNAL_TIMEOUT_MS = 8000;
const externalWarnings = [];
const decodeHtmlUrl = (url) => url
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, '\'');

const checkExternal = async (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    externalWarnings.push(`${url} -> URL parse error`);
    return;
  }

  if (parsed.hostname === 'trackglp1.com' || parsed.hostname === 'www.trackglp1.com') {
    return;
  }

  const resolvedUrl = decodeHtmlUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

  try {
    let response = await fetch(resolvedUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ShotClock-LinkChecker/1.0 (+https://trackglp1.com)'
      }
    });

    if (response.status >= 400 || response.status === 405) {
      response = await fetch(resolvedUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ShotClock-LinkChecker/1.0 (+https://trackglp1.com)'
        }
      });
    }

    if (response.status >= 400) {
      externalWarnings.push(`${resolvedUrl} -> HTTP ${response.status}`);
    }
  } catch (err) {
    externalWarnings.push(`${resolvedUrl} -> ${err.name}: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
};

const run = async () => {
  const urls = [...externalLinks];
  const concurrency = 16;
  let cursor = 0;

  const worker = async () => {
    while (cursor < urls.length) {
      const index = cursor++;
      await checkExternal(urls[index]);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));

  if (externalWarnings.length > 0) {
    console.warn(`External link warnings (${externalWarnings.length}):`);
    for (const warning of externalWarnings) {
      console.warn(`- ${warning}`);
    }
    console.warn('External warnings are non-blocking. Review and curate as needed.');
  } else {
    console.log('External link checks returned no warnings.');
  }
};

await run();
