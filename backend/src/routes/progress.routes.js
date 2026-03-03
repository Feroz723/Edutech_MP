const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { markLessonComplete, getCourseProgress } = require("../controllers/progress.controller");

router.post("/:lessonId/complete", authMiddleware, markLessonComplete);
// Backward-compatible alias used by frontend
router.post("/complete/:lessonId", authMiddleware, markLessonComplete);
router.get("/:courseId", authMiddleware, getCourseProgress);

module.exports = router;
