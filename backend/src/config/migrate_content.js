require("dotenv").config();
const pool = require("./db");

async function migrate() {
    try {
        console.log("🚀 Starting migration...");

        // Add lesson_resources table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_resources (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'link',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ lesson_resources table checked/created");

        // Add lesson_assignments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                max_points INT DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ lesson_assignments table checked/created");

        console.log("🎉 Migration completed successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
