import "@workspace/db";
import { storage } from "../../artifacts/api-server/src/db/storage";

async function main() {
  console.log("Seeding database via storage repository...");
  await storage.ensureDatabaseSeeded();
  console.log("Seeding process completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
