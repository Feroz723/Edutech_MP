const pool = require("../config/db");

exports.submitReview = async (req, res) => {
    const userId = req.user.userId;
    const { courseId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Valid rating (1-5) required" });

    try {
        // 1. Verify purchase
        const purchaseRes = await pool.query(`
            SELECT 1 FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1 AND oi.course_id = $2 AND o.status = 'completed'
        `, [userId, courseId]);

        if (purchaseRes.rows.length === 0) return res.status(403).json({ message: "You must purchase the course to leave a review" });

        // 2. Insert review
        await pool.query(`
            INSERT INTO reviews (user_id, course_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, course_id) DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
        `, [userId, courseId, rating, comment]);

        res.status(200).json({ message: "Review submitted successfully" });
    } catch (error) {
        console.error("Review submit error:", error);
        res.status(500).json({ message: "Failed to submit review" });
    }
};

exports.getCourseReviews = async (req, res) => {
    const { courseId } = req.params;

    try {
        const result = await pool.query(`
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.course_id = $1
            ORDER BY r.created_at DESC
        `, [courseId]);

        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
};
