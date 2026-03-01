require("dotenv").config();
const pool = require("./db");

async function migrate() {
    try {
        console.log("🚀 Starting Governance & Portfolio migration...");

        // Add audit_logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                details JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ audit_logs table checked/created");

        // Add certificates table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                certificate_url TEXT,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ certificates table checked/created");

        console.log("🎉 Migration completed successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
