#!/usr/bin/env node

import { spawn } from "child_process";
import { build } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Build main process first
console.log("Building Electron main process...");
await build({
  configFile: path.join(projectRoot, "vite.electron.config.ts"),
  mode: "development",
});

// Start Vite dev server
console.log("Starting Vite dev server...");
const viteProcess = spawn("npx", ["vite"], {
  cwd: projectRoot,
  stdio: "inherit",
});

// Wait a bit for Vite to start
setTimeout(() => {
  console.log("Starting Electron...");
  const electronProcess = spawn("npx", ["electron", "."], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_IS_DEV: "1",
    },
  });

  electronProcess.on("close", () => {
    viteProcess.kill();
    process.exit(0);
  });
}, 3000);

process.on("SIGINT", () => {
  viteProcess.kill();
  process.exit(0);
});
