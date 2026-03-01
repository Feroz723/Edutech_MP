const pool = require("../config/db");
const jwt = require("jsonwebtoken");

exports.becomeInstructor = async (req, res) => {
    const userId = req.user.userId;
    const { expertise } = req.body;

    if (!expertise) {
        return res.status(400).json({ message: "Expertise is required" });
    }

    try {
        await pool.query("BEGIN");

        // Update user role
        const userUpdate = await pool.query(
            "UPDATE users SET role = 'instructor' WHERE id = $1 RETURNING *",
            [userId]
        );

        const user = userUpdate.rows[0];

        // Create instructor profile
        await pool.query(
            "INSERT INTO instructor_profiles (user_id, expertise) VALUES ($1, $2)",
            [userId, expertise]
        );

        await pool.query("COMMIT");

        // Generate new token with updated role
        const newToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(200).json({
            message: "User promoted to instructor successfully",
            token: newToken,
        });
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Instructor onboarding error:", error);
        res.status(500).json({ message: "Failed to become instructor" });
    }
};
