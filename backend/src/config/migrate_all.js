require("dotenv").config();
const pool = require("./db");

async function migrateAll() {
    try {
        console.log("🚀 Starting FULL backend migration...\n");

        // =============================================
        // 1. COLUMN ADDITIONS (safe IF NOT EXISTS)
        // =============================================

        // 1a. users.is_suspended
        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_suspended') THEN
                    ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);
        console.log("✅ users.is_suspended column ensured");

        // 1b. lessons.duration
        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'duration') THEN
                    ALTER TABLE lessons ADD COLUMN duration INT DEFAULT 10;
                END IF;
            END $$;
        `);
        console.log("✅ lessons.duration column ensured");

        // 1c. courses.thumbnail_url
        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'thumbnail_url') THEN
                    ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
                END IF;
            END $$;
        `);
        console.log("✅ courses.thumbnail_url column ensured");

        // 1d. orders payment tracking columns
        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_provider') THEN
                    ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gateway_txn_id') THEN
                    ALTER TABLE orders ADD COLUMN gateway_txn_id VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gateway_order_id') THEN
                    ALTER TABLE orders ADD COLUMN gateway_order_id VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status_raw') THEN
                    ALTER TABLE orders ADD COLUMN payment_status_raw VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_verified_at') THEN
                    ALTER TABLE orders ADD COLUMN payment_verified_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'gateway_payload') THEN
                    ALTER TABLE orders ADD COLUMN gateway_payload JSONB;
                END IF;
            END $$;
        `);
        console.log("✅ orders payment tracking columns ensured");

        // =============================================
        // 2. TABLE CREATION (safe IF NOT EXISTS)
        // =============================================

        // 2a. lesson_resources
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
        console.log("✅ lesson_resources table ensured");

        // 2b. lesson_assignments
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
        console.log("✅ lesson_assignments table ensured");

        // 2c. lesson_progress (CRITICAL - used by progress & student controllers)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id)
            );
        `);
        console.log("✅ lesson_progress table ensured");

        // 2d. instructor_earnings (used by order controller)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS instructor_earnings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                student_id UUID REFERENCES users(id) ON DELETE CASCADE,
                order_id UUID,
                gross_amount NUMERIC NOT NULL,
                platform_fee NUMERIC NOT NULL,
                instructor_share NUMERIC NOT NULL,
                payout_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ instructor_earnings table ensured");

        // 2e. audit_logs (used by admin controller)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                details JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ audit_logs table ensured");

        // 2f. certificates (used by student controller)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                certificate_url TEXT,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ certificates table ensured");

        // 2g. platform_settings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS platform_settings (
                id INT PRIMARY KEY DEFAULT 1,
                platform_name VARCHAR(255) DEFAULT 'EduTech Global Academy',
                support_email VARCHAR(255) DEFAULT 'support@edutechglobal.com',
                logo_url TEXT,
                theme VARCHAR(50) DEFAULT 'light',
                mfa_enabled BOOLEAN DEFAULT FALSE,
                password_complexity VARCHAR(50) DEFAULT 'medium',
                session_timeout INT DEFAULT 30,
                smtp_host VARCHAR(255),
                smtp_port INT,
                notification_enrollment BOOLEAN DEFAULT TRUE,
                notification_digest BOOLEAN DEFAULT FALSE,
                currency VARCHAR(10) DEFAULT 'INR',
                tax_percentage NUMERIC DEFAULT 18,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ platform_settings table ensured");

        // 2h. assignment_submissions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                assignment_id UUID REFERENCES lesson_assignments(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                content TEXT,
                file_url TEXT,
                grade NUMERIC,
                feedback TEXT,
                status VARCHAR(50) DEFAULT 'submitted',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(assignment_id, user_id)
            );
        `);
        console.log("✅ assignment_submissions table ensured");

        // =============================================
        // 3. INDEX CREATION (for performance)
        // =============================================
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);`);
        console.log("✅ Performance indexes ensured");

        // =============================================
        // 4. SEED DEFAULT CATEGORIES (if empty)
        // =============================================
        const catCheck = await pool.query("SELECT COUNT(*) FROM categories");
        if (Number(catCheck.rows[0].count) === 0) {
            const defaultCategories = [
                "Web Development",
                "Mobile Development",
                "Data Science",
                "Machine Learning",
                "Cloud Computing",
                "Cybersecurity",
                "UI/UX Design",
                "Business",
                "Marketing",
                "Photography"
            ];
            for (const name of defaultCategories) {
                await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
            }
            console.log("✅ Default categories seeded");
        } else {
            console.log("ℹ️  Categories already exist — skipping seed");
        }

        // 5. SEED DEFAULT SETTINGS (if empty)
        const settingsCheck = await pool.query("SELECT COUNT(*) FROM platform_settings");
        if (Number(settingsCheck.rows[0].count) === 0) {
            await pool.query("INSERT INTO platform_settings (id) VALUES (1)");
            console.log("✅ Default platform settings seeded");
        }

        console.log("\n🎉 FULL migration completed successfully!");
        console.log("   All tables and columns are now in sync with controllers.\n");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrateAll();
