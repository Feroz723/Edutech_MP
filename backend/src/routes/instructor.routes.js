const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
    becomeInstructor,
} = require("../controllers/instructor.controller");

const {
    getInstructorEarnings,
} = require("../controllers/earnings.controller");

// Promote student to instructor
router.post(
    "/become",
    authMiddleware,
    becomeInstructor
);

// Backward-compatible alias used by frontend
router.post(
    "/apply",
    authMiddleware,
    becomeInstructor
);

// Instructor stats
router.get(
    "/stats",
    authMiddleware,
    roleMiddleware("instructor"),
    async (req, res) => {
        const instructorId = req.user.userId;
        try {
            // Total courses
            const coursesResult = await pool.query(
                "SELECT COUNT(*) FROM courses WHERE instructor_id = $1",
                [instructorId]
            );

            // Total students (unique buyers)
            const studentsResult = await pool.query(`
                SELECT COUNT(DISTINCT o.user_id) 
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN courses c ON oi.course_id = c.id
                WHERE c.instructor_id = $1 AND o.status = 'completed'
            `, [instructorId]);

            // Total earnings
            const earningsResult = await pool.query(
                "SELECT COALESCE(SUM(instructor_share), 0) as total FROM instructor_earnings WHERE instructor_id = $1",
                [instructorId]
            );

            // Monthly earnings (current month)
            const monthlyResult = await pool.query(`
                SELECT COALESCE(SUM(instructor_share), 0) as total 
                FROM instructor_earnings 
                WHERE instructor_id = $1 
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            `, [instructorId]);

            // Total sales
            const salesResult = await pool.query(`
                SELECT COUNT(*) 
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN courses c ON oi.course_id = c.id
                WHERE c.instructor_id = $1 AND o.status = 'completed'
            `, [instructorId]);

            // Daily earnings (last 30 days)
            const dailyEarningsResult = await pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(instructor_share) as earnings
                FROM instructor_earnings
                WHERE instructor_id = $1
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, [instructorId]);

            res.json({
                totalCourses: Number(coursesResult.rows[0].count),
                totalStudents: Number(studentsResult.rows[0].count),
                totalEarnings: Number(earningsResult.rows[0].total),
                monthlyEarnings: Number(monthlyResult.rows[0].total),
                totalSales: Number(salesResult.rows[0].count),
                dailyEarnings: dailyEarningsResult.rows
            });
        } catch (err) {
            console.error("Instructor stats error:", err);
            res.status(500).json({ message: "Failed to fetch instructor stats" });
        }
    }
);

// Instructor dashboard
router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("instructor"),
    async (req, res) => {
        const instructorId = req.user.userId;
        try {
            const courses = await pool.query("SELECT COUNT(*) FROM courses WHERE instructor_id = $1", [instructorId]);
            const revenue = await pool.query("SELECT COALESCE(SUM(instructor_share), 0) FROM instructor_earnings WHERE instructor_id = $1", [instructorId]);
            const topCourse = await pool.query(`
                SELECT c.title, SUM(ie.instructor_share) as revenue
                FROM instructor_earnings ie
                JOIN courses c ON ie.course_id = c.id
                WHERE ie.instructor_id = $1
                GROUP BY c.id, c.title
                ORDER BY revenue DESC
                LIMIT 1
            `, [instructorId]);

            res.json({
                totalCourses: Number(courses.rows[0].count),
                totalRevenue: Number(revenue.rows[0].coalesce),
                topCourse: topCourse.rows[0] || null
            });
        } catch {
            res.status(500).json({ message: "Failed to fetch instructor stats" });
        }
    }
);

// Earnings dashboard
router.get(
    "/earnings",
    authMiddleware,
    roleMiddleware("instructor"),
    getInstructorEarnings
);

module.exports = router;
