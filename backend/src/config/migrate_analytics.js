const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("./db");

async function migrateAnalytics() {
    console.log("🚀 Starting Analytics & Student Profile Migration...");

    try {
        // Add new columns to user_profiles
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS institute_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS qualification VARCHAR(255),
            ADD COLUMN IF NOT EXISTS city VARCHAR(255),
            ADD COLUMN IF NOT EXISTS state VARCHAR(255),
            ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
        `);
        console.log("✅ Successfully added institutional columns to user_profiles.");

        // Sync name/contact if needed (optional)

        console.log("🏁 Migration Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration Failed:", error);
        process.exit(1);
    }
}

migrateAnalytics();
