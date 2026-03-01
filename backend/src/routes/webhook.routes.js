const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/payment.controller");

// Razorpay Webhook - Authority on payment status
router.post("/razorpay", handleWebhook);

module.exports = router;
