require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log("Starting Phase 35 Migrations...");

        // Add notification columns to users
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS notif_course_updates BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS notif_deadlines BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS notif_community BOOLEAN DEFAULT true
        `);
        console.log("- Added notification columns to users");

        // Add due_at to lesson_assignments
        await pool.query(`
            ALTER TABLE lesson_assignments 
            ADD COLUMN IF NOT EXISTS due_at TIMESTAMP
        `);
        console.log("- Added due_at column to lesson_assignments");

        // Add some dummy due dates for existing assignments to test "Missing" tab
        await pool.query(`
            UPDATE lesson_assignments 
            SET due_at = NOW() - INTERVAL '2 days' 
            WHERE due_at IS NULL
        `);
        console.log("- Updated existing assignments with test due dates");

        console.log("Migrations completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
