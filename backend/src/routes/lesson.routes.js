const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
    addLesson,
    getLessonsForCourse,
    deleteLesson,
    addResource,
    deleteResource,
    addAssignment,
    deleteAssignment
} = require("../controllers/lesson.controller");

// Admin adds lesson (Governance Authority)
router.post(
    "/:courseId",
    authMiddleware,
    roleMiddleware("admin"),
    addLesson
);

// Student views lessons (must be authenticated)
router.get(
    "/:courseId",
    authMiddleware,
    getLessonsForCourse
);

// Delete lesson (Admin Decommissioning)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteLesson
);

// Resource Management
router.post(
    "/resource/:lessonId",
    authMiddleware,
    roleMiddleware("admin"),
    addResource
);

router.delete(
    "/resource/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteResource
);

// Assignment Management
router.post(
    "/assignment/:lessonId",
    authMiddleware,
    roleMiddleware("admin"),
    addAssignment
);

router.delete(
    "/assignment/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteAssignment
);

module.exports = router;
