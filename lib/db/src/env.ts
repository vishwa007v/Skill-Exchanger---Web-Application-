import fs from "node:fs";
import path from "node:path";

/**
 * Searches up from the current working directory to find a .env file
 * and loads its variables into process.env without overriding existing ones.
 */
export function loadEnv(): void {
  // Try up to 5 directory levels upwards
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(cur, ".env");
    if (fs.existsSync(candidate)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(candidate);
        } else {
          // Manual fallback for older node runtimes
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
        // Continue searching if file load fails
      }
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
}

// Auto-run on import
loadEnv();
