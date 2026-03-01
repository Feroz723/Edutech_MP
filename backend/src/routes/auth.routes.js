const express = require("express");
const router = express.Router();
const { googleLogin, register, login, updateProfile, changeRole, getProfile, updateNotifications, changePassword } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/google", googleLogin);
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/notifications", authMiddleware, updateNotifications);
router.post("/change-password", authMiddleware, changePassword);
router.post("/change-role", authMiddleware, changeRole);

module.exports = router;
