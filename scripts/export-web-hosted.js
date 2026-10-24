#!/usr/bin/env node
/* eslint-env node */
/*
 * Builds the web app so it can be served from any path: a subfolder on a
 * static host, a CDN prefix, or a hosted page like a claude.ai artifact.
 *
 *   node scripts/export-web-hosted.js [outDir]        (default: dist-hosted)
 *
 * `expo export` writes every URL from the origin root ("/_expo/…",
 * "/assets/…"), and the async route loader resolves chunk URLs against the
 * page origin. This script makes the export relative and pins it to where
 * index.html lives:
 *   1. absolute references become relative in index.html and the bundles;
 *   2. index.html gets a <base> set at runtime to its own directory;
 *   3. the loader's URL builder resolves against document.baseURI.
 * Together with the +not-found route (which sends unknown paths to the
 * start), the app boots from a subpath and navigates with its lazy routes.
 *
 * The patch in step 3 targets Expo's minified metro runtime; if a new SDK
 * changes it, this script fails loudly rather than shipping a broken build.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const out = path.resolve(process.argv[2] ?? 'dist-hosted');
fs.rmSync(out, { recursive: true, force: true });
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', out], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

// Some hosts reserve top-level names starting with "_", so the bundle folder moves.
const BUNDLE_DIR = 'expo-static';
fs.renameSync(path.join(out, '_expo'), path.join(out, BUNDLE_DIR));
const bundlesDir = path.join(out, BUNDLE_DIR, 'static', 'js', 'web');
const bundles = fs.readdirSync(bundlesDir).map((f) => path.join(bundlesDir, f));
const indexPath = path.join(out, 'index.html');

// 1. Relative references, pointing at the renamed folder.
for (const file of [indexPath, ...bundles]) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = source
    .replace(/"\/_expo\//g, `"${BUNDLE_DIR}/`)
    .replace(/"\/assets\//g, '"assets/')
    .replace(/"\/favicon\.ico"/g, '"favicon.ico"');
  if (relative !== source) fs.writeFileSync(file, relative);
}

// 2. A <base> pinned to the page's own directory, before any script runs.
const shim = `    <!-- Hosted from a subpath: pin relative URLs to where this page lives, and let the router start at the root. -->
    <script>
      (function () {
        var dir = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
        var base = document.createElement('base');
        base.href = dir;
        document.head.appendChild(base);
      })();
    </script>
`;
const index = fs.readFileSync(indexPath, 'utf8');
const marker = '    <style id="expo-reset">';
if (!index.includes(marker)) throw new Error('index.html changed shape; update scripts/export-web-hosted.js');
fs.writeFileSync(indexPath, index.replace(marker, shim + marker));

// 3. Chunk URLs resolve against the <base>, not the page origin.
const entry = bundles.find((f) => path.basename(f).startsWith('entry-'));
if (!entry) throw new Error('No entry bundle found');
const before = fs.readFileSync(entry, 'utf8');
const builder =
  "buildUrlForBundle=function(e){if(/^https?:\\/\\//.test(e))return e;const{url:t}=(0,u.default)();return t?new URL(e,t).toString():`//${e.replace(/^\\/+/,'')}`}";
if (!before.includes(builder)) throw new Error("Expo's metro runtime changed; update the buildUrlForBundle patch in scripts/export-web-hosted.js");
const after = before
  .replace(builder, "buildUrlForBundle=function(e){if(/^https?:\\/\\//.test(e))return e;return new URL(e,document.baseURI).toString()}")
  .replace(/new URL\(e,window\.location\)/g, 'new URL(e,document.baseURI)');
fs.writeFileSync(entry, after);

console.log(`Hosted web build in ${out}. Serve the folder from any path; open index.html.`);
