const pool = require("../config/db");

// Helper to record audit logs
const logAction = async (userId, action, details = {}) => {
    try {
        await pool.query(
            "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
            [userId, action, JSON.stringify(details)]
        );
    } catch (error) {
        console.error("Audit log error:", error);
    }
};

exports.getPlatformAnalytics = async (req, res) => {
    try {
        // Total users (Students + Admins)
        const usersResult = await pool.query(
            "SELECT COUNT(*) FROM users"
        );

        // Total courses
        const coursesResult = await pool.query(
            "SELECT COUNT(*) FROM courses"
        );

        // Completed sales
        const salesResult = await pool.query(
            "SELECT COUNT(*) FROM orders WHERE status = 'completed'"
        );

        // Gross revenue
        const grossRevenueResult = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed'"
        );

        // Platform Profit (In admin-only model, this is total revenue minus any fees, but here we'll treat it as total gross)
        const platformRevenueResult = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed'"
        );

        // Enrollment grouped by day
        const enrollmentByDayResult = await pool.query(
            `SELECT 
          DATE(created_at) as date,
          COUNT(*) as enrollment
        FROM users
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30`
        );

        // Revenue grouped by day
        const revenueByDayResult = await pool.query(
            `SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as gross_revenue
        FROM orders
        WHERE status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30`
        );

        // Top courses by revenue
        const topCoursesResult = await pool.query(
            `SELECT c.title, COALESCE(SUM(oi.price), 0) as revenue
             FROM order_items oi
             JOIN courses c ON oi.course_id = c.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status = 'completed'
             GROUP BY c.id, c.title
             ORDER BY revenue DESC
             LIMIT 5`
        );

        // Merge revenue and enrollment for chart
        const revenueMap = {};
        revenueByDayResult.rows.forEach(r => {
            const dateStr = new Date(r.date).toLocaleDateString();
            revenueMap[dateStr] = { date: dateStr, revenue: Number(r.gross_revenue), enrollment: 0 };
        });

        enrollmentByDayResult.rows.forEach(e => {
            const dateStr = new Date(e.date).toLocaleDateString();
            if (revenueMap[dateStr]) {
                revenueMap[dateStr].enrollment = Number(e.enrollment);
            } else {
                revenueMap[dateStr] = { date: dateStr, revenue: 0, enrollment: Number(e.enrollment) };
            }
        });

        const revenueData = Object.values(revenueMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        res.status(200).json({
            totalUsers: Number(usersResult.rows[0].count),
            totalCourses: Number(coursesResult.rows[0].count),
            totalSales: Number(salesResult.rows[0].count),
            grossRevenue: Number(grossRevenueResult.rows[0].coalesce),
            platformRevenue: Number(platformRevenueResult.rows[0].coalesce),
            platformProfit: Number(platformRevenueResult.rows[0].coalesce),
            revenueData: revenueData,
            topCourses: topCoursesResult.rows,
            topInstructors: []
        });

    } catch (error) {
        console.error("Admin analytics error:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, role, is_suspended, created_at FROM users ORDER BY created_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
        await logAction(req.user.userId, "UPDATE_USER_ROLE", { targetUserId: id, newRole: role });
        res.status(200).json({ message: "Role updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update role" });
    }
};

exports.toggleUserSuspension = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await pool.query("SELECT is_suspended FROM users WHERE id = $1", [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const newState = !user.rows[0].is_suspended;
        await pool.query("UPDATE users SET is_suspended = $1 WHERE id = $2", [newState, id]);

        await logAction(req.user.userId, newState ? "SUSPEND_USER" : "UNSUSPEND_USER", { targetUserId: id });

        res.status(200).json({ message: `User ${newState ? 'suspended' : 'unsuspended'}` });
    } catch (error) {
        res.status(500).json({ message: "Failed to toggle suspension" });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting self
        if (id === req.user.userId) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING name", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        await logAction(req.user.userId, "DELETE_USER", { targetUserId: id, name: result.rows[0].name });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

const bcrypt = require("bcrypt");
exports.createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password || "EduStream123!", 10);
        const result = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name, email, hashedPassword, role || 'student']
        );

        await logAction(req.user.userId, "CREATE_USER", { targetUserId: result.rows[0].id, email });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.name as instructor_name,
            (SELECT COUNT(*) FROM order_items WHERE course_id = c.id) as sales_count
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch courses" });
    }
};

exports.approveCourse = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE courses SET is_published = TRUE WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        await logAction(req.user.userId, "APPROVE_COURSE", { courseId: id, title: result.rows[0].title });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to approve course" });
    }
};

exports.unpublishCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE courses SET is_published = false WHERE id = $1", [id]);
        await logAction(req.user.userId, "UNPUBLISH_COURSE", { courseId: id });
        res.status(200).json({ message: "Course unpublished" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unpublish course" });
    }
};

exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM lessons WHERE course_id = $1", [id]);
        const result = await pool.query("DELETE FROM courses WHERE id = $1 RETURNING title", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        await logAction(req.user.userId, "DELETE_COURSE", { courseId: id, title: result.rows[0].title });
        res.status(200).json({ message: "Course decommissioned successfully" });
    } catch (error) {
        console.error("Delete course error:", error);
        res.status(500).json({ message: "Failed to decommission course" });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.*, u.name as user_name, c.title as course_title
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN courses c ON oi.course_id = c.id
            ORDER BY o.created_at DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT al.*, u.name as user_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT 50
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM platform_settings WHERE id = 1");
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings" });
    }
};

exports.updateSettings = async (req, res) => {
    const {
        platform_name,
        support_email,
        logo_url,
        theme,
        mfa_enabled,
        password_complexity,
        session_timeout,
        smtp_host,
        smtp_port,
        notification_enrollment,
        notification_digest,
        currency,
        tax_percentage
    } = req.body;

    try {
        await pool.query(
            `UPDATE platform_settings SET 
                platform_name = $1, 
                support_email = $2, 
                logo_url = $3, 
                theme = $4, 
                mfa_enabled = $5, 
                password_complexity = $6, 
                session_timeout = $7, 
                smtp_host = $8, 
                smtp_port = $9, 
                notification_enrollment = $10, 
                notification_digest = $11, 
                currency = $12, 
                tax_percentage = $13,
                updated_at = NOW()
            WHERE id = 1`,
            [platform_name, support_email, logo_url, theme, mfa_enabled, password_complexity, session_timeout, smtp_host, smtp_port, notification_enrollment, notification_digest, currency, tax_percentage]
        );

        await logAction(req.user.userId, "UPDATE_SETTINGS", { updated_fields: Object.keys(req.body) });
        res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ message: "Failed to update settings" });
    }
};

exports.getRecentEnrollments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.name as student_name,
                c.title as course_title,
                o.created_at,
                o.status
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN users u ON o.user_id = u.id
            JOIN courses c ON oi.course_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Recent enrollments error:", error);
        res.status(500).json({ message: "Failed to fetch recent enrollments" });
    }
};

exports.getFinancialStats = async (req, res) => {
    try {
        // Total Revenue
        const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'");

        // Total Payouts (instructor earnings that are not paid out)
        const pendingPayoutsResult = await pool.query("SELECT COALESCE(SUM(instructor_share), 0) as total FROM instructor_earnings WHERE payout_status = 'pending'");

        // Net Profit (Total Revenue - Total Instructor Shares)
        const instructorSharesResult = await pool.query("SELECT COALESCE(SUM(instructor_share), 0) as total FROM instructor_earnings");
        const netProfit = Number(revenueResult.rows[0].total) - Number(instructorSharesResult.rows[0].total);

        // Chart Data (Last 6 months)
        const chartDataResult = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'Mon') as month,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status = 'completed'
              AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY month, DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
        `);

        res.status(200).json({
            totalRevenue: Number(revenueResult.rows[0].total),
            pendingPayouts: Number(pendingPayoutsResult.rows[0].total),
            netProfit: netProfit,
            chartData: chartDataResult.rows
        });
    } catch (error) {
        console.error("Finance stats error:", error);
        res.status(500).json({ message: "Failed to fetch financial stats" });
    }
};
exports.getDetailedStudentAnalytics = async (req, res) => {
    try {
        // KPI Data
        const totalRevenueRes = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'");
        const newRegistrationsTodayRes = await pool.query("SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE");
        const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users");
        const activeCoursesRes = await pool.query("SELECT COUNT(*) FROM courses WHERE is_published = TRUE");

        const totalRevenue = Number(totalRevenueRes.rows[0].total);
        const newRegToday = Number(newRegistrationsTodayRes.rows[0].count);
        const totalUsers = Number(totalUsersRes.rows[0].count);
        const activeCourses = Number(activeCoursesRes.rows[0].count);
        const arpu = totalUsers > 0 ? (totalRevenue / totalUsers) : 0;

        // Detailed Students List
        const studentsResult = await pool.query(`
            SELECT 
                u.id, 
                u.created_at as registration_date, 
                u.name, 
                u.email,
                p.contact_number, 
                p.qualification, 
                p.city, 
                p.state,
                p.institute_name,
                (
                    SELECT string_agg(c.title, ', ') 
                    FROM order_items oi 
                    JOIN courses c ON oi.course_id = c.id 
                    JOIN orders o ON oi.order_id = o.id
                    WHERE o.user_id = u.id AND o.status = 'completed'
                ) as courses,
                (
                    SELECT COALESCE(SUM(total_amount), 0) 
                    FROM orders 
                    WHERE user_id = u.id AND status = 'completed'
                ) as revenue
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC
        `);

        res.status(200).json({
            kpis: {
                totalRevenue,
                newRegistrationsToday: newRegToday,
                totalUsers,
                activeCourses,
                avgRevenuePerUser: arpu
            },
            students: studentsResult.rows
        });
    } catch (error) {
        console.error("Detailed analytics error:", error);
        res.status(500).json({ message: "Failed to fetch detailed analytics" });
    }
};

exports.getGeographicDistribution = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COALESCE(p.state, 'Unknown') as state, 
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE role = 'student'), 1) as percentage
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.role = 'student'
            GROUP BY p.state
            ORDER BY count DESC
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Geo distribution error:", error);
        res.status(500).json({ message: "Failed to fetch geographic distribution" });
    }
};
// Export for other controllers
exports.logAction = logAction;
