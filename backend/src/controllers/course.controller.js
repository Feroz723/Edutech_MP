const pool = require("../config/db");
const { logAction } = require("./admin.controller");

exports.createCourse = async (req, res) => {
    const instructorId = req.user.userId;
    const { title, description, price, category_id } = req.body;

    if (!title || !price) {
        return res.status(400).json({ message: "Title and price are required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO courses (instructor_id, category_id, title, description, price, is_published)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
            [instructorId, category_id || null, title, description || null, price]
        );

        const course = result.rows[0];
        await logAction(instructorId, "CREATE_COURSE", { courseId: course.id, title: course.title });
        res.status(201).json(course);
    } catch (error) {
        console.error("Create course error:", error);
        res.status(500).json({ message: "Failed to create course" });
    }
};

exports.getMyCourses = async (req, res) => {
    const instructorId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT * FROM courses WHERE instructor_id = $1 ORDER BY created_at DESC`,
            [instructorId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Fetch courses error:", error);
        res.status(500).json({ message: "Failed to fetch courses" });
    }
};

exports.getCourseById = async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM courses WHERE id = $1",
            [courseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = result.rows[0];

        // Check ownership, admin role (Removed student enrollment check for open access)
        if (course.instructor_id !== userId && req.user.role !== 'admin') {
            // No restriction for authenticated users in open access mode
        }

        res.status(200).json(course);
    } catch (error) {
        console.error("Get course error:", error);
        res.status(500).json({ message: "Failed to fetch course details" });
    }
};

exports.publishCourse = async (req, res) => {
    const instructorId = req.user.userId;
    const { courseId } = req.params;

    try {
        const result = await pool.query(
            `UPDATE courses 
       SET is_published = TRUE 
       WHERE id = $1 AND instructor_id = $2 
       RETURNING *`,
            [courseId, instructorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        await logAction(instructorId, "PUBLISH_COURSE", { courseId, title: result.rows[0].title });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Publish course error:", error);
        res.status(500).json({ message: "Failed to publish course" });
    }
};

exports.getCourseForLearning = async (req, res) => {
    const userId = req.user.userId;
    const courseId = req.params.id;

    try {
        // Open access mode: No purchase check required

        // Fetch course title
        const courseResult = await pool.query(
            "SELECT title FROM courses WHERE id = $1",
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Fetch lessons
        const lessonsResult = await pool.query(
            `SELECT id, title, youtube_video_id, position 
             FROM lessons 
             WHERE course_id = $1 
             ORDER BY position ASC`,
            [courseId]
        );

        res.status(200).json({
            title: courseResult.rows[0].title,
            lessons: lessonsResult.rows,
        });
    } catch (error) {
        console.error("Get learning content error:", error);
        res.status(500).json({ message: "Failed to fetch learning content" });
    }
};

exports.updateCourse = async (req, res) => {
    const instructorId = req.user.userId;
    const { id } = req.params;
    const { title, description, price, category_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE courses 
             SET title = COALESCE($1, title), 
                 description = COALESCE($2, description), 
                 price = COALESCE($3, price), 
                 category_id = COALESCE($4, category_id),
                 thumbnail_url = COALESCE($5, thumbnail_url)
             WHERE id = $6 AND instructor_id = $7
             RETURNING *`,
            [title, description, price, category_id, req.body.thumbnail_url, id, instructorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course not found or unauthorized" });
        }

        await logAction(instructorId, "UPDATE_COURSE", { courseId: id, updates: req.body });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Update course error:", error);
        res.status(500).json({ message: "Failed to update course" });
    }
};
