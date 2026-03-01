const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
    createPayment,
    verifyPayment,
} = require("../controllers/payment.controller");

router.post("/create", authMiddleware, createPayment);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;
