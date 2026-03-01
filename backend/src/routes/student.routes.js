const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
    getMyEnrolledCourses,
    getStudentStats,
    getRecentActivity,
    getStudentAssignments,
    getCertificates,
    submitAssignment
} = require("../controllers/student.controller");

router.get("/courses", authMiddleware, getMyEnrolledCourses);
router.get("/stats", authMiddleware, getStudentStats);
router.get("/activity", authMiddleware, getRecentActivity);
router.get("/assignments", authMiddleware, getStudentAssignments);
router.get("/certificates", authMiddleware, getCertificates);
router.post("/assignments/submit", authMiddleware, submitAssignment);

module.exports = router;
