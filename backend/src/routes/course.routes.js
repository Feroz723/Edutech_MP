const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
    createCourse,
    getMyCourses,
    publishCourse,
    getCourseForLearning,
    updateCourse,
    getCourseById,
} = require("../controllers/course.controller");

// Get single course (Admin/Instructor Edit)
router.get(
    "/:courseId",
    authMiddleware,
    getCourseById
);

// Create course (Admin Governance)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    createCourse
);

// Get my courses (Admin viewing their portfolio)
router.get(
    "/mine",
    authMiddleware,
    roleMiddleware("admin"),
    getMyCourses
);

// Publish course (Admin Marketplace Sync)
router.put(
    "/:courseId/publish",
    authMiddleware,
    roleMiddleware("admin"),
    publishCourse
);

// Update course (Admin Modification)
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    updateCourse
);

// Get learning content (unlocked by purchase)
router.get(
    "/:id/learn",
    authMiddleware,
    getCourseForLearning
);

module.exports = router;
