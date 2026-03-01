const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { submitReview, getCourseReviews } = require("../controllers/review.controller");

router.post("/", authMiddleware, submitReview);
router.get("/:courseId", getCourseReviews); // Publicly viewable

module.exports = router;
