require("dotenv").config();
const fs = require("fs");
const pool = require("./db");

async function runSchema() {
    try {
        const sql = fs.readFileSync(__dirname + "/init.sql").toString();
        await pool.query(sql);
        console.log("✅ Schema initialized successfully");
        process.exit();
    } catch (err) {
        console.error("❌ Error initializing schema:", err);
        process.exit(1);
    }
}

runSchema();
