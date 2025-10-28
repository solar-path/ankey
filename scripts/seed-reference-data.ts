/**
 * Seed Script for Reference Data (Countries and Industries)
 *
 * This script imports countries and industries from JSON files into PostgreSQL.
 * Run with: bun run scripts/seed-reference-data.ts
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read JSON files
const countries = JSON.parse(
  readFileSync(join(__dirname, "./data/country.json"), "utf-8")
);
const industries = JSON.parse(
  readFileSync(join(__dirname, "./data/industry.json"), "utf-8")
);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ankey',
});

async function createTables() {
  console.log("📋 Creating reference data tables...");

  const createTablesSQL = `
    -- Countries table
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      locale TEXT NOT NULL,
      language TEXT NOT NULL,
      currency TEXT NOT NULL,
      phone_code TEXT NOT NULL,
      timezones JSONB NOT NULL DEFAULT '[]'::JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create index on country name for search
    CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);

    -- Industries table (GICS - Global Industry Classification Standard)
    CREATE TABLE IF NOT EXISTS industries (
      code INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create index on industry title for search
    CREATE INDEX IF NOT EXISTS idx_industries_title ON industries(title);
  `;

  try {
    await pool.query(createTablesSQL);
    console.log("✅ Tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}

async function seedCountries() {
  console.log("📍 Seeding countries...");

  try {
    // Clear existing data
    await pool.query("DELETE FROM countries");
    console.log("  Cleared existing countries");

    // Prepare insert query
    const insertQuery = `
      INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        locale = EXCLUDED.locale,
        language = EXCLUDED.language,
        currency = EXCLUDED.currency,
        phone_code = EXCLUDED.phone_code,
        timezones = EXCLUDED.timezones
    `;

    let successful = 0;
    let failed = 0;

    for (const country of countries) {
      try {
        await pool.query(insertQuery, [
          country.code,
          country.name,
          country.locale,
          country.language,
          country.currency,
          country.phoneCode,
          JSON.stringify(country.timezones),
        ]);
        successful++;
      } catch (error: any) {
        console.error(`  Failed to insert ${country.code}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Countries seeded: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error("❌ Error seeding countries:", error);
    throw error;
  }
}

async function seedIndustries() {
  console.log("🏭 Seeding industries...");

  try {
    // Clear existing data
    await pool.query("DELETE FROM industries");
    console.log("  Cleared existing industries");

    // Prepare insert query
    const insertQuery = `
      INSERT INTO industries (code, title, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (code) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description
    `;

    let successful = 0;
    let failed = 0;

    for (const industry of industries) {
      try {
        await pool.query(insertQuery, [
          industry.code,
          industry.title,
          industry.description,
        ]);
        successful++;
      } catch (error: any) {
        console.error(`  Failed to insert ${industry.code}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Industries seeded: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error("❌ Error seeding industries:", error);
    throw error;
  }
}

async function verifyData() {
  console.log("🔍 Verifying seeded data...");

  try {
    const countriesResult = await pool.query("SELECT COUNT(*) as count FROM countries");
    const industriesResult = await pool.query("SELECT COUNT(*) as count FROM industries");

    console.log(`  Countries in database: ${countriesResult.rows[0].count}`);
    console.log(`  Industries in database: ${industriesResult.rows[0].count}`);
    console.log("✅ Data verification complete");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
  }
}

async function main() {
  console.log("🚀 Starting reference data seed...\n");
  console.log(`Database: ${process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, "//***:***@") || "Not set"}\n`);

  try {
    await createTables();
    await seedCountries();
    await seedIndustries();
    await verifyData();

    console.log("\n✨ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seed script
main();
