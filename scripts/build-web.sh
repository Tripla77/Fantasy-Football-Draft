#!/usr/bin/env bash
# Build the static web app into dist/, ready to publish to GitHub Pages.
# Shared by the production deploy and the PR-preview workflows so they stay in
# sync. Set EXPO_BASE_URL to the subpath the site is served from (e.g.
# /Fantasy-Football-Draft or /Fantasy-Football-Draft/pr-preview/pr-42) so
# assets resolve correctly; leave it unset to serve from the root.
set -euo pipefail

npx expo export --platform web

# Bypass Jekyll so the _expo/ asset folder (leading underscore) is served.
touch dist/.nojekyll
# SPA fallback so deep links / refreshes serve the app. Copied before the head
# injection, which patches both index.html and 404.html.
cp dist/index.html dist/404.html
# Ship the home-screen icons + web manifest + service worker alongside the app.
cp web/manifest.webmanifest web/icon.svg web/icon-192.png \
   web/icon-512.png web/apple-touch-icon.png web/sw.js dist/
# Wire the manifest/icons/meta + safe-area viewport into the HTML.
node scripts/inject-web-head.mjs
