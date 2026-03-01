const pool = require("../config/db");

exports.getInstructorEarnings = async (req, res) => {
    const instructorId = req.user.userId;

    try {
        // Get total earnings
        const profileResult = await pool.query(
            "SELECT total_earnings FROM instructor_profiles WHERE user_id = $1",
            [instructorId]
        );

        const totalEarnings = profileResult.rows[0]?.total_earnings || 0;

        // Get total sales count
        const salesResult = await pool.query(
            "SELECT COUNT(*) FROM instructor_earnings WHERE instructor_id = $1",
            [instructorId]
        );

        const totalSales = salesResult.rows[0].count;

        // Get detailed earnings history
        const historyResult = await pool.query(
            `SELECT 
         ie.id,
         ie.gross_amount,
         ie.platform_fee,
         ie.instructor_share,
         ie.payout_status,
         ie.created_at,
         c.title AS course_title,
         u.name AS student_name
       FROM instructor_earnings ie
       JOIN courses c ON ie.course_id = c.id
       JOIN users u ON ie.student_id = u.id
       WHERE ie.instructor_id = $1
       ORDER BY ie.created_at DESC`,
            [instructorId]
        );

        res.status(200).json({
            totalEarnings: Number(totalEarnings),
            totalSales: Number(totalSales),
            transactions: historyResult.rows,
        });

    } catch (error) {
        console.error("Fetch earnings error:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
    }
};
