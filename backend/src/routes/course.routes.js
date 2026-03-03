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

// Get my courses (Instructor/Admin portfolio)
router.get(
    "/mine",
    authMiddleware,
    roleMiddleware(["admin", "instructor"]),
    getMyCourses
);

// Backward-compatible alias used by frontend
router.get(
    "/my-courses",
    authMiddleware,
    roleMiddleware(["admin", "instructor"]),
    getMyCourses
);

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
    roleMiddleware(["admin", "instructor"]),
    createCourse
);

// Publish course (Admin Marketplace Sync)
router.put(
    "/:courseId/publish",
    authMiddleware,
    roleMiddleware(["admin", "instructor"]),
    publishCourse
);

// Update course (Admin Modification)
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(["admin", "instructor"]),
    updateCourse
);

// Get learning content (unlocked by purchase)
router.get(
    "/:id/learn",
    authMiddleware,
    getCourseForLearning
);

module.exports = router;
