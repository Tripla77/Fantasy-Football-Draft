// Post-processes the exported web build's HTML (dist/index.html and its SPA
// fallback dist/404.html): matches the browser chrome to the app background,
// enables safe-area insets, and wires up the PWA manifest, icons and mobile
// web-app meta tags so the site can be installed to the home screen. Run in CI
// after `expo export` (see scripts/build-web.sh). Pure fs — no dependencies.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BG = '#0b1220'; // colors.bg from src/theme.ts

const headTags = [
  // Match the app background so mobile browsers don't flash white bars in the
  // status-bar / safe-area regions above and below the app.
  `<meta name="theme-color" content="${BG}" />`,
  `<style>html,body{background-color:${BG}}</style>`,
  // PWA: installable to the home screen.
  '<link rel="manifest" href="manifest.webmanifest" />',
  '<link rel="icon" type="image/svg+xml" href="icon.svg" />',
  '<link rel="apple-touch-icon" href="apple-touch-icon.png" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Draft HQ" />',
].join('\n    ');

for (const file of ['dist/index.html', 'dist/404.html']) {
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  // Let content extend into the safe areas so the app's CSS can inset the
  // header and tab bar precisely (env(safe-area-inset-*) is 0 without this).
  html = html.replace(
    'width=device-width, initial-scale=1, shrink-to-fit=no',
    'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
  );
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `    ${headTags}\n  </head>`);
  }
  writeFileSync(file, html);
  console.log('patched', file);
}
