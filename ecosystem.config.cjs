module.exports = {
  apps: [
    {
      // Lightweight static preview for local QA (SPA fallback included).
      // `npx wrangler pages dev dist` also works but needs more memory.
      name: "public-embrilo",
      script: "npx",
      args: "vite preview --host 0.0.0.0 --port 3000 --strictPort",
      env: { NODE_ENV: "production" },
      watch: false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
