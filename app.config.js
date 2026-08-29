// Dynamic Expo config. Reads the static values from app.json and, when
// EXPO_BASE_URL is set (used by the GitHub Pages CI build so assets resolve
// under the /Fantasy-Football-Draft/ subpath), injects it as the web baseUrl.
// Local dev and native builds leave it unset and serve from the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments || {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
