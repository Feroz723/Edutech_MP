const pool = require('./db');
const bcrypt = require('bcrypt');

async function seedDefaultUsers() {
    try {
        const saltRounds = 10;

        // Default password for testing
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

        // Check if admin exists
        const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@edutech.com'");

        if (adminCheck.rows.length === 0) {
            // Create admin user with password
            await pool.query(
                "INSERT INTO users (email, name, password, role) VALUES ('admin@edutech.com', 'Admin User', $1, 'admin')",
                [hashedPassword]
            );
            console.log('✅ Admin user created: admin@edutech.com');
        } else {
            // Update admin password if exists
            await pool.query(
                "UPDATE users SET password = $1 WHERE email = 'admin@edutech.com'",
                [hashedPassword]
            );
            console.log('ℹ️ Admin user already exists - password updated');
        }

        // Create a test student account
        const studentCheck = await pool.query("SELECT * FROM users WHERE email = 'student@edutech.com'");

        if (studentCheck.rows.length === 0) {
            await pool.query(
                "INSERT INTO users (email, name, password, role) VALUES ('student@edutech.com', 'Student User', $1, 'student')",
                [hashedPassword]
            );
            console.log('✅ Student user created: student@edutech.com');
        } else {
            await pool.query(
                "UPDATE users SET password = $1 WHERE email = 'student@edutech.com'",
                [hashedPassword]
            );
            console.log('ℹ️ Student user already exists - password updated');
        }

        console.log('\n📋 Default Credentials (Password for all: password123):');
        console.log('   Admin: admin@edutech.com');
        console.log('   Student: student@edutech.com');
        console.log('   Note: Instructor role has been consolidated into Admin.\n');

    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

module.exports = seedDefaultUsers;
