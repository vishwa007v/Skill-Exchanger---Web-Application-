import "@workspace/db"; // loads .env automatically
import pg from "pg";

const { Client } = pg;

async function checkDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  console.log("==================================================");
  console.log("       Skill Exchanger Database Status Checker    ");
  console.log("==================================================");

  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL is not set.");
    console.log("Please create a .env file in the workspace root with:");
    console.log("DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/skillexchanger");
    process.exit(1);
  }

  // Mask credentials for safe logging
  try {
    const parsed = new URL(dbUrl);
    const maskedUser = parsed.username || "postgres";
    const maskedHost = parsed.host;
    const dbName = parsed.pathname.replace(/^\//, "");
    console.log(`Target: postgresql://${maskedUser}:*****@${maskedHost}/${dbName}`);
  } catch {
    console.log("Target: [DATABASE_URL configured]");
  }

  const client = new Client({ connectionString: dbUrl });

  try {
    console.log("\nAttempting connection to PostgreSQL...");
    await client.connect();
    console.log("✅ Successfully connected to PostgreSQL server!");

    const verRes = await client.query("SELECT version();");
    console.log(`Server version: ${verRes.rows[0].version.split(",")[0]}`);

    // Check tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));
    console.log(`\nFound ${existingTables.size} table(s) in 'public' schema:`);

    const expectedTables = [
      "users",
      "courses",
      "content_blocks",
      "quiz_questions",
      "enrollments",
      "ratings",
    ];

    let allPresent = true;
    for (const table of expectedTables) {
      if (existingTables.has(table)) {
        const countRes = await client.query(`SELECT count(*) FROM "${table}";`);
        const count = countRes.rows[0].count;
        console.log(`  ✅ ${table.padEnd(16)} (rows: ${count})`);
      } else {
        console.log(`  ❌ ${table.padEnd(16)} (MISSING)`);
        allPresent = false;
      }
    }

    if (!allPresent) {
      console.log("\n⚠️  Some expected tables are missing.");
      console.log("Run migrations with: pnpm --filter @workspace/db run push");
    } else {
      console.log("\n🎉 All required tables are present and ready for Skill Exchanger!");
    }

    await client.end();
  } catch (err: any) {
    console.error("\n❌ Database Connection Failed:");
    console.error(err.message);
    if (err.code === "28P01") {
      console.error("\n👉 Authentication failed for user 'postgres'. Please verify your password in .env");
    } else if (err.code === "ECONNREFUSED") {
      console.error("\n👉 Connection refused on port 5432. Please ensure the PostgreSQL service is running.");
    } else if (err.code === "3D000") {
      console.error("\n👉 Database 'skillexchanger' does not exist. Please create it in pgAdmin or psql.");
    }
    process.exit(1);
  }
}

checkDatabase();
