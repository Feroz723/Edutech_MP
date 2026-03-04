const express = require("express");
const router = express.Router();
const { handlePaytmWebhook } = require("../controllers/payment.controller");

// Paytm callback/webhook endpoint
router.post("/paytm", handlePaytmWebhook);

module.exports = router;
