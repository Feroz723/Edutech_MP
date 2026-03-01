const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const {
    createOrder,
    getMyOrders,
    refundOrder,
    verifyAccess,
    mockPurchase
} = require("../controllers/order.controller");

// Student creates/views orders
router.post("/", authMiddleware, createOrder);
router.get("/mine", authMiddleware, getMyOrders);

// Verify access to a course (for video player)
router.get("/verify-access/:courseId", authMiddleware, verifyAccess);

// Mock purchase for testing (bypasses payment)
router.post("/mock-purchase", authMiddleware, mockPurchase);

// Admin refunds order
router.post(
    "/:orderId/refund",
    authMiddleware,
    roleMiddleware("admin"),
    refundOrder
);

module.exports = router;
