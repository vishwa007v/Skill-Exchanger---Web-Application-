import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

// Load .env automatically
function loadEnv(): void {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(cur, ".env");
    if (fs.existsSync(candidate)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(candidate);
        } else {
          const raw = fs.readFileSync(candidate, "utf8");
          for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex > 0) {
              const key = trimmed.slice(0, eqIndex).trim();
              let val = trimmed.slice(eqIndex + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (!(key in process.env)) {
                process.env[key] = val;
              }
            }
          }
        }
        return;
      } catch {
        // Continue searching
      }
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in .env or your environment variables.");
}

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
