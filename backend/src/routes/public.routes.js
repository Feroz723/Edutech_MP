const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const {
    getAllPublishedCourses,
    getCourseById,
    searchCourses,
    getTrendingCourses
} = require("../controllers/public.controller");

// Public search
router.get("/courses/search", searchCourses);

// Public trending
router.get("/courses/trending", getTrendingCourses);

// Public listing
router.get("/courses", getAllPublishedCourses);

// Public course detail
router.get("/courses/:courseId", getCourseById);

// Public: Get all categories
router.get("/categories", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Fetch categories error:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

module.exports = router;
