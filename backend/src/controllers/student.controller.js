const pool = require("../config/db");

exports.getMyEnrolledCourses = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(`
            SELECT DISTINCT
                c.id, c.title, c.description, c.instructor_id,
                u.name as instructor_name,
                (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
                (SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1 AND course_id = c.id) as completed_lessons
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            LEFT JOIN order_items oi ON oi.course_id = c.id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = $1 AND o.status = 'completed'
            LEFT JOIN lesson_progress lp ON lp.user_id = $1 AND lp.course_id = c.id
            WHERE (o.id IS NOT NULL OR lp.id IS NOT NULL)
            ORDER BY c.title ASC
        `, [userId]);

        const courses = result.rows.map(row => ({
            ...row,
            total_lessons: Number(row.total_lessons),
            completed_lessons: Number(row.completed_lessons),
            progress: row.total_lessons > 0 ? Math.round((row.completed_lessons / row.total_lessons) * 100) : 0
        }));

        res.status(200).json(courses);
    } catch (error) {
        console.error("Fetch enrolled courses error:", error);
        res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
};

exports.getStudentStats = async (req, res) => {
    const userId = req.user.userId;

    try {
        const counts = await pool.query(`
            SELECT 
                (SELECT COUNT(DISTINCT c.id) 
                 FROM courses c
                 LEFT JOIN order_items oi ON oi.course_id = c.id
                 LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = $1 AND o.status = 'completed'
                 LEFT JOIN lesson_progress lp ON lp.user_id = $1 AND lp.course_id = c.id
                 WHERE (o.id IS NOT NULL OR lp.id IS NOT NULL)) as total_courses,
                (SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1) as lessons_completed
        `, [userId]);

        // Calculate completed courses (100% progress)
        const completedResult = await pool.query(`
            SELECT COUNT(DISTINCT c.id) as completed_count
            FROM courses c
            LEFT JOIN order_items oi ON oi.course_id = c.id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = $1 AND o.status = 'completed'
            LEFT JOIN lesson_progress lp ON lp.user_id = $1 AND lp.course_id = c.id
            WHERE (o.id IS NOT NULL OR lp.id IS NOT NULL)
            AND (
                SELECT COUNT(*) FROM lessons WHERE course_id = c.id
            ) = (
                SELECT COUNT(*) FROM lesson_progress WHERE user_id = $1 AND course_id = c.id
            )
            AND (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) > 0
        `, [userId]);

        // Calculate total learning hours (estimate based on lesson duration)
        const hoursResult = await pool.query(`
            SELECT COALESCE(SUM(l.duration), 0) as total_minutes
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = $1
        `, [userId]);

        const totalMinutes = Number(hoursResult.rows[0]?.total_minutes || 0);
        const totalHours = Math.round(totalMinutes / 60);

        // Calculate actual earned certificates
        const certsResult = await pool.query(`
            SELECT COUNT(*) as cert_count FROM certificates WHERE user_id = $1
        `, [userId]);

        res.status(200).json({
            totalCourses: Number(counts.rows[0].total_courses || 0),
            completedCourses: Number(completedResult.rows[0]?.completed_count || 0),
            totalHours: totalHours,
            certificatesEarned: Number(certsResult.rows[0]?.cert_count || 0),
            lessonsCompleted: Number(counts.rows[0].lessons_completed || 0)
        });
    } catch (error) {
        console.error("Fetch stats error:", error);
        res.status(500).json({
            totalCourses: 0,
            completedCourses: 0,
            totalHours: 0,
            certificatesEarned: 0
        });
    }
};

exports.getRecentActivity = async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query(`
            SELECT 
                lp.completed_at,
                l.title as lesson_title,
                c.title as course_title
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE lp.user_id = $1
            ORDER BY lp.completed_at DESC
            LIMIT 5
        `, [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch activity" });
    }
};

exports.getStudentAssignments = async (req, res) => {
    const userId = req.user.userId;
    try {
        // This is a simplified fetch, we'll return all assignments for enrolled courses
        const result = await pool.query(`
            SELECT 
                la.*, 
                c.title as course_title,
                l.title as lesson_title,
                asub.status as submission_status,
                asub.grade,
                asub.feedback,
                asub.submitted_at
            FROM lesson_assignments la
            JOIN lessons l ON la.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            LEFT JOIN order_items oi ON c.id = oi.course_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.user_id = $1 AND o.status = 'completed'
            LEFT JOIN lesson_progress lp ON lp.user_id = $1 AND lp.course_id = c.id
            LEFT JOIN assignment_submissions asub ON la.id = asub.assignment_id AND asub.user_id = $1
            WHERE (o.id IS NOT NULL OR lp.id IS NOT NULL)
            ORDER BY la.created_at DESC
        `, [userId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Fetch assignments error:", error);
        res.status(500).json({ message: "Failed to fetch assignments" });
    }
};

exports.getCertificates = async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query(`
            SELECT 
                cert.*, 
                c.title as course_title,
                c.thumbnail_url,
                u.name as instructor_name
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            WHERE cert.user_id = $1
            ORDER BY cert.issued_at DESC
        `, [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch certificates" });
    }
};

exports.submitAssignment = async (req, res) => {
    const userId = req.user.userId;
    const { assignmentId, content, fileUrl } = req.body;

    try {
        await pool.query(`
            INSERT INTO assignment_submissions (assignment_id, user_id, content, file_url, status)
            VALUES ($1, $2, $3, $4, 'submitted')
            ON CONFLICT (assignment_id, user_id) 
            DO UPDATE SET content = EXCLUDED.content, file_url = EXCLUDED.file_url, submitted_at = NOW()
        `, [assignmentId, userId, content, fileUrl]);

        res.status(200).json({ message: "Assignment submitted successfully" });
    } catch (error) {
        console.error("Assignment submission error:", error);
        res.status(500).json({ message: "Failed to submit assignment" });
    }
};
