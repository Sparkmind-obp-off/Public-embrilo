module.exports = {
  apps: [
    {
      // Full stack: static SPA + Pages Functions (/api/*) + local D1 (needs a "DB" binding in wrangler.jsonc).
      name: "public-embrilo",
      script: "bash",
      args: ["-c", "ulimit -c 0 && npx wrangler pages dev dist --ip 0.0.0.0 --port 3000"],
      env: { NODE_ENV: "development" },
      watch: false,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "600M",
    },
  ],
};
