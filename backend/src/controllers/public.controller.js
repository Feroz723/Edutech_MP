const pool = require("../config/db");

exports.getAllPublishedCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.price,
        c.created_at,
        c.category_id,
        u.name AS instructor_name,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_reviews,
        cat.name AS category_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN reviews r ON c.id = r.course_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = TRUE
      GROUP BY c.id, u.name, cat.name
      ORDER BY c.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Public courses error:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

exports.getCourseById = async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.price,
        c.created_at,
        c.category_id,
        u.name AS instructor_name,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_reviews,
        cat.name AS category_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN reviews r ON c.id = r.course_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1 AND c.is_published = TRUE
      GROUP BY c.id, u.name, cat.name
    `, [courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Course detail error:", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

exports.searchCourses = async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.price,
        u.name AS instructor_name,
        cat.name AS category_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE (c.title ILIKE $1 OR c.description ILIKE $1) AND c.is_published = TRUE
      ORDER BY c.created_at DESC
    `, [`%${query}%`]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Search courses error:", error);
    res.status(500).json({ message: "Failed to search courses" });
  }
};

exports.getTrendingCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.price,
        cat.name AS category_name,
        COUNT(oi.id) as enrollment_count
      FROM courses c
      LEFT JOIN order_items oi ON c.id = oi.course_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = TRUE
      GROUP BY c.id, cat.name
      ORDER BY enrollment_count DESC
      LIMIT 5
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Trending courses error:", error);
    res.status(500).json({ message: "Failed to fetch trending courses" });
  }
};
