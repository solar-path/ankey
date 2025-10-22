import PouchDB from 'pouchdb-node';
import PouchDBFind from 'pouchdb-find';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Add the find plugin
PouchDB.plugin(PouchDBFind);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read JSON files
const countries = JSON.parse(
  readFileSync(join(__dirname, '../src/api/db/country.json'), 'utf-8')
);
const industries = JSON.parse(
  readFileSync(join(__dirname, '../src/api/db/industry.json'), 'utf-8')
);

// CouchDB configuration from .env file
const COUCHDB_URL = process.env.VITE_COUCHDB_URL || 'http://admin:Miranda32@127.0.0.1:5984';

// Create database instances
const countriesDB = new PouchDB(`${COUCHDB_URL}/countries`);
const industriesDB = new PouchDB(`${COUCHDB_URL}/industries`);

async function importCountries() {
  console.log('📍 Importing countries...');

  try {
    // Check if database exists and create if needed
    const info = await countriesDB.info();
    console.log(`Countries DB exists with ${info.doc_count} documents`);

    // Transform countries data to have proper _id
    const docs = countries.map((country) => ({
      _id: country.code,
      ...country,
      type: 'country',
      importedAt: Date.now(),
    }));

    // Bulk insert
    const result = await countriesDB.bulkDocs(docs, { new_edits: true });

    const successful = result.filter((r: any) => r.ok).length;
    const failed = result.filter((r: any) => !r.ok).length;

    console.log(`✅ Countries imported: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      console.log('Failed documents:', result.filter((r: any) => !r.ok));
    }
  } catch (error) {
    console.error('❌ Error importing countries:', error);
  }
}

async function importIndustries() {
  console.log('🏭 Importing industries...');

  try {
    // Check if database exists and create if needed
    const info = await industriesDB.info();
    console.log(`Industries DB exists with ${info.doc_count} documents`);

    // Transform industries data to have proper _id
    const docs = industries.map((industry) => ({
      _id: industry.code.toString(),
      ...industry,
      type: 'industry',
      importedAt: Date.now(),
    }));

    // Bulk insert
    const result = await industriesDB.bulkDocs(docs, { new_edits: true });

    const successful = result.filter((r: any) => r.ok).length;
    const failed = result.filter((r: any) => !r.ok).length;

    console.log(`✅ Industries imported: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      console.log('Failed documents:', result.filter((r: any) => !r.ok));
    }
  } catch (error) {
    console.error('❌ Error importing industries:', error);
  }
}

async function createIndexes() {
  console.log('🔍 Creating indexes...');

  try {
    // Create indexes for countries
    await countriesDB.createIndex({
      index: { fields: ['name'] },
    });
    await countriesDB.createIndex({
      index: { fields: ['code'] },
    });
    await countriesDB.createIndex({
      index: { fields: ['type'] },
    });
    console.log('✅ Countries indexes created');

    // Create indexes for industries
    await industriesDB.createIndex({
      index: { fields: ['code'] },
    });
    await industriesDB.createIndex({
      index: { fields: ['title'] },
    });
    await industriesDB.createIndex({
      index: { fields: ['type'] },
    });
    console.log('✅ Industries indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

async function main() {
  console.log('🚀 Starting data import...\n');
  console.log(`CouchDB URL: ${COUCHDB_URL.replace(/\/\/.*:.*@/, '//***:***@')}\n`);

  await importCountries();
  await importIndustries();
  await createIndexes();

  console.log('\n✨ Import completed!');
  process.exit(0);
}

// Run the import
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
