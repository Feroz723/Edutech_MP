const pool = require("../config/db");

exports.addLesson = async (req, res) => {
    const instructorId = req.user.userId;
    const { courseId } = req.params;
    const { title, youtube_video_id, position } = req.body;

    if (!title || !youtube_video_id) {
        return res.status(400).json({ message: "Title and YouTube ID required" });
    }

    try {
        // Verify course ownership
        const courseCheck = await pool.query(
            "SELECT * FROM courses WHERE id = $1 AND instructor_id = $2",
            [courseId, instructorId]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const result = await pool.query(
            `INSERT INTO lessons (course_id, title, youtube_video_id, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [courseId, title, youtube_video_id, position || 1]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Add lesson error:", error);
        res.status(500).json({ message: "Failed to add lesson" });
    }
};

exports.getLessonsForCourse = async (req, res) => {
    const userId = req.user?.userId;
    const { courseId } = req.params;

    try {
        const courseOwnCheck = await pool.query(
            "SELECT * FROM courses WHERE id = $1",
            [courseId]
        );

        if (courseOwnCheck.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        const isInstructor = courseOwnCheck.rows[0].instructor_id === userId;
        const isAdmin = req.user?.role === 'admin';

        if (!isInstructor && !isAdmin) {
            if (!courseOwnCheck.rows[0].is_published) {
                return res.status(404).json({ message: "Course not found" });
            }
            // Open access: No purchase check required
        }

        // Fetch lessons
        const lessonsResult = await pool.query(
            `SELECT id, title, youtube_video_id, position
       FROM lessons
       WHERE course_id = $1
       ORDER BY position ASC`,
            [courseId]
        );

        const lessons = lessonsResult.rows;

        // Fetch resources and assignments for all lessons in this course
        const lessonsWithContent = await Promise.all(lessons.map(async (lesson) => {
            const [resources, assignments] = await Promise.all([
                pool.query("SELECT * FROM lesson_resources WHERE lesson_id = $1 ORDER BY created_at ASC", [lesson.id]),
                pool.query("SELECT * FROM lesson_assignments WHERE lesson_id = $1 ORDER BY created_at ASC", [lesson.id])
            ]);
            return {
                ...lesson,
                resources: resources.rows,
                assignments: assignments.rows
            };
        }));

        res.status(200).json(lessonsWithContent);
    } catch (error) {
        console.error("Fetch lessons error:", error);
        res.status(500).json({ message: "Failed to fetch curriculum modules" });
    }
};

// Resource Management
exports.addResource = async (req, res) => {
    const { lessonId } = req.params;
    const { title, url, type } = req.body;

    if (!title || !url) {
        return res.status(400).json({ message: "Title and URL required" });
    }

    try {
        // Verify lesson belongs to a course owned by this instructor (or admin)
        const lessonCheck = await pool.query(
            `SELECT l.*, c.instructor_id 
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             WHERE l.id = $1`,
            [lessonId]
        );

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        if (req.user.role !== 'admin' && lessonCheck.rows[0].instructor_id !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized to modify this lesson's resources" });
        }

        const result = await pool.query(
            `INSERT INTO lesson_resources (lesson_id, title, url, type)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [lessonId, title, url, type || 'link']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Add resource error:", error);
        res.status(500).json({ message: "Failed to add resource" });
    }
};

exports.deleteResource = async (req, res) => {
    const { id } = req.params;
    try {
        // Verify resource ownership via lesson/course
        const resourceCheck = await pool.query(
            `SELECT r.*, c.instructor_id 
             FROM lesson_resources r
             JOIN lessons l ON r.lesson_id = l.id
             JOIN courses c ON l.course_id = c.id
             WHERE r.id = $1`,
            [id]
        );

        if (resourceCheck.rows.length === 0) {
            return res.status(404).json({ message: "Resource not found" });
        }

        if (req.user.role !== 'admin' && resourceCheck.rows[0].instructor_id !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await pool.query("DELETE FROM lesson_resources WHERE id = $1", [id]);
        res.status(200).json({ message: "Resource deleted" });
    } catch (error) {
        console.error("Delete resource error:", error);
        res.status(500).json({ message: "Failed to delete resource" });
    }
};

// Assignment Management
exports.addAssignment = async (req, res) => {
    const { lessonId } = req.params;
    const { title, description, max_points } = req.body;

    if (!title) {
        return res.status(400).json({ message: "Title required" });
    }

    try {
        // Verify lesson belongs to a course owned by this instructor (or admin)
        const lessonCheck = await pool.query(
            `SELECT l.*, c.instructor_id 
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             WHERE l.id = $1`,
            [lessonId]
        );

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        if (req.user.role !== 'admin' && lessonCheck.rows[0].instructor_id !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized to modify this lesson's assignments" });
        }

        const result = await pool.query(
            `INSERT INTO lesson_assignments (lesson_id, title, description, max_points)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [lessonId, title, description, max_points || 100]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Add assignment error:", error);
        res.status(500).json({ message: "Failed to add assignment" });
    }
};

exports.deleteAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        // Verify assignment ownership via lesson/course
        const assignmentCheck = await pool.query(
            `SELECT a.*, c.instructor_id 
             FROM lesson_assignments a
             JOIN lessons l ON a.lesson_id = l.id
             JOIN courses c ON l.course_id = c.id
             WHERE a.id = $1`,
            [id]
        );

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        if (req.user.role !== 'admin' && assignmentCheck.rows[0].instructor_id !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await pool.query("DELETE FROM lesson_assignments WHERE id = $1", [id]);
        res.status(200).json({ message: "Assignment deleted" });
    } catch (error) {
        console.error("Delete assignment error:", error);
        res.status(500).json({ message: "Failed to delete assignment" });
    }
};

exports.deleteLesson = async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const { id } = req.params;

    try {
        const lessonCheck = await pool.query(
            `SELECT l.*, c.instructor_id 
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             WHERE l.id = $1`,
            [id]
        );

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        if (!isAdmin && lessonCheck.rows[0].instructor_id !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await pool.query("DELETE FROM lessons WHERE id = $1", [id]);
        res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (error) {
        console.error("Delete lesson error:", error);
        res.status(500).json({ message: "Failed to delete lesson" });
    }
};
