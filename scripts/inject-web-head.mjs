// Post-processes the exported web build's HTML (dist/index.html and its SPA
// fallback dist/404.html): enables safe-area insets and wires up the PWA
// manifest, icons and mobile web-app meta tags so the site can be installed to
// the home screen. Run in CI after `expo export`
// (see .github/workflows/deploy-pages.yml). Pure fs — no dependencies.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// theme-color and the html/body background are injected by the deploy
// workflow's "Prepare static output" step, so they are intentionally omitted
// here to avoid duplicate tags.
const headTags = [
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
