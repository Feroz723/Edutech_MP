const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const {
    getPlatformAnalytics,
    getAllUsers,
    updateUserRole,
    toggleUserSuspension,
    getAllCourses,
    approveCourse,
    unpublishCourse,
    deleteCourse,
    getAllOrders,
    getAuditLogs,
    getSettings,
    updateSettings,
    deleteUser,
    createUser,
    getFinancialStats,
    getRecentEnrollments,
    getDetailedStudentAnalytics,
    getGeographicDistribution
} = require("../controllers/admin.controller");

const { refundOrder } = require("../controllers/order.controller");

// Platform analytics
router.get("/analytics", authMiddleware, roleMiddleware("admin"), getPlatformAnalytics);

// User Management
router.get("/users", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.post("/users", authMiddleware, roleMiddleware("admin"), createUser);
router.put("/users/:id/role", authMiddleware, roleMiddleware("admin"), updateUserRole);
router.put("/users/:id/suspend", authMiddleware, roleMiddleware("admin"), toggleUserSuspension);
router.delete("/users/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

// Course Management (Governance)
router.get("/courses", authMiddleware, roleMiddleware("admin"), getAllCourses);
router.put("/courses/:id/approve", authMiddleware, roleMiddleware("admin"), approveCourse);
router.patch("/courses/:id/unpublish", authMiddleware, roleMiddleware("admin"), unpublishCourse);
router.delete("/courses/:id", authMiddleware, roleMiddleware("admin"), deleteCourse);

// Order Management
router.get("/orders", authMiddleware, roleMiddleware("admin"), getAllOrders);
router.post("/orders/:orderId/refund", authMiddleware, roleMiddleware("admin"), refundOrder);

// Audit Logs
router.get("/logs", authMiddleware, roleMiddleware("admin"), getAuditLogs);

// Platform Settings
router.get("/settings", authMiddleware, roleMiddleware("admin"), getSettings);
router.put("/settings", authMiddleware, roleMiddleware("admin"), updateSettings);

// Finance Stats
router.get("/finance-stats", authMiddleware, roleMiddleware("admin"), getFinancialStats);

// Recent Enrollments
router.get("/enrollments/recent", authMiddleware, roleMiddleware("admin"), getRecentEnrollments);

// Detailed Analytics
router.get("/detailed-analytics", authMiddleware, roleMiddleware("admin"), getDetailedStudentAnalytics);
router.get("/geo-distribution", authMiddleware, roleMiddleware("admin"), getGeographicDistribution);

module.exports = router;
