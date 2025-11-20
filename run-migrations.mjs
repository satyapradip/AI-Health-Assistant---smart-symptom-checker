import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log("📋 Reading migration files...\n");

    const migrationsDir = path.join(__dirname, "supabase/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`✅ Found ${migrationFiles.length} migration file(s)\n`);
    console.log(
      "⚠️  IMPORTANT: To apply these migrations, follow these steps:\n"
    );
    console.log(
      "1. Go to: https://supabase.com/dashboard/project/pfduadihoswvnemdqnek/sql/new"
    );
    console.log("2. Copy and paste the SQL code below into the editor");
    console.log('3. Click "Run" to execute the SQL\n');
    console.log(
      "═════════════════════════════════════════════════════════════\n"
    );

    for (const file of migrationFiles) {
      console.log(`\n📄 File: ${file}`);
      console.log(
        "─────────────────────────────────────────────────────────────\n"
      );

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(sql);
      console.log(
        "\n─────────────────────────────────────────────────────────────\n"
      );
    }

    console.log(
      "═════════════════════════════════════════════════════════════"
    );
    console.log("\n✨ Copy the SQL above and run it in Supabase SQL Editor");
    console.log("Then refresh your browser to apply the changes!\n");
  } catch (error) {
    console.error("❌ Error reading migrations:", error);
    process.exit(1);
  }
}

runMigrations();
