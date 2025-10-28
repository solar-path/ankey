/**
 * Script to delete all workspace companies and related data
 * Run with: bun run scripts/delete-companies.ts
 */

// @ts-ignore - PouchDB is loaded globally
const PouchDB = require("pouchdb");

const COUCHDB_URL = process.env.VITE_COUCHDB_URL || "http://admin:password@127.0.0.1:5984";

const companiesDB = new PouchDB(`${COUCHDB_URL}/companies`);
const userCompaniesDB = new PouchDB(`${COUCHDB_URL}/user_companies`);
const orgchartsDB = new PouchDB(`${COUCHDB_URL}/orgcharts`);

async function deleteCompanies() {
  console.log("🗑️  Starting company deletion...\n");

  try {
    // Get all workspace companies
    const companiesResult = await companiesDB.allDocs({ include_docs: true });
    const workspaceCompanies = companiesResult.rows
      .map((row: any) => row.doc)
      .filter((doc: any) => doc && doc.type === "workspace");

    console.log(`📋 Found ${workspaceCompanies.length} workspace companies`);

    for (const company of workspaceCompanies) {
      console.log(`\n🏢 Deleting company: ${company.title} (${company._id})`);

      // Delete user_company associations
      const userCompaniesResult = await userCompaniesDB.find({
        selector: {
          companyId: company._id,
          type: "user_company",
        },
      });

      console.log(`  ├─ Found ${userCompaniesResult.docs.length} user associations`);
      for (const uc of userCompaniesResult.docs) {
        await userCompaniesDB.remove(uc._id, uc._rev);
      }

      // Delete all partitioned data (orgcharts, matrices, workflows, tasks)
      const partitionedResult = await orgchartsDB.find({
        selector: {
          _id: {
            $gte: `company:${company._id}:`,
            $lte: `company:${company._id}:\ufff0`,
          },
        },
      });

      console.log(`  ├─ Found ${partitionedResult.docs.length} partitioned documents`);
      for (const doc of partitionedResult.docs) {
        await orgchartsDB.remove(doc._id, doc._rev);
      }

      // Delete company
      await companiesDB.remove(company._id, company._rev);
      console.log(`  └─ ✅ Company deleted successfully`);
    }

    console.log("\n✨ All workspace companies deleted successfully!");
  } catch (error) {
    console.error("\n❌ Error deleting companies:", error);
    process.exit(1);
  }
}

deleteCompanies();
