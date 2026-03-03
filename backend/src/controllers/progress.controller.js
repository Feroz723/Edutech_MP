const pool = require("../config/db");

exports.markLessonComplete = async (req, res) => {
    const userId = req.user.userId;
    const { lessonId } = req.params;

    try {
        // 1. Get course_id for this lesson
        const lessonRes = await pool.query("SELECT course_id FROM lessons WHERE id = $1", [lessonId]);
        if (lessonRes.rows.length === 0) return res.status(404).json({ message: "Lesson not found" });
        const courseId = lessonRes.rows[0].course_id;

        // 2. Mark as complete (ignore if already exists due to unique constraint)
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, course_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, lesson_id) DO NOTHING
        `, [userId, lessonId, courseId]);

        // 3. Check for 100% Course Completion
        const totalLessonsRes = await pool.query("SELECT COUNT(*) FROM lessons WHERE course_id = $1", [courseId]);
        const completedLessonsRes = await pool.query("SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1 AND course_id = $2", [userId, courseId]);

        const totalLessons = parseInt(totalLessonsRes.rows[0].count);
        const completedLessons = parseInt(completedLessonsRes.rows[0].count);

        if (totalLessons > 0 && completedLessons === totalLessons) {
            // Check if certificate already exists
            const certCheck = await pool.query("SELECT id FROM certificates WHERE user_id = $1 AND course_id = $2", [userId, courseId]);
            if (certCheck.rows.length === 0) {
                // Generate simulated certificate record
                const certId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                await pool.query(
                    "INSERT INTO certificates (user_id, course_id, certificate_url) VALUES ($1, $2, $3)",
                    [userId, courseId, `https://edustream.io/verify/${certId}`]
                );
            }
        }

        res.status(200).json({
            message: "Lesson marked complete",
            isCourseComplete: completedLessons === totalLessons
        });
    } catch (error) {
        console.error("Progress mark error:", error);
        res.status(500).json({ message: "Failed to update progress" });
    }
};

exports.getCourseProgress = async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.params;

    try {
        const result = await pool.query(
            "SELECT lesson_id FROM lesson_progress WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );
        res.status(200).json(result.rows.map(r => r.lesson_id));
    } catch {
        res.status(500).json({ message: "Failed to fetch progress" });
    }
};
