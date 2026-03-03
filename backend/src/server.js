require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const pool = require("./config/db");
const seedDefaultUsers = require("./config/seed");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const publicRoutes = require("./routes/public.routes");
const lessonRoutes = require("./routes/lesson.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const webhookRoutes = require("./routes/webhook.routes");
const adminRoutes = require("./routes/admin.routes");
const studentRoutes = require("./routes/student.routes");
const progressRoutes = require("./routes/progress.routes");
const reviewRoutes = require("./routes/review.routes");
const instructorRoutes = require("./routes/instructor.routes");
const { globalLimiter, authLimiter, orderLimiter, paymentLimiter } = require("./middlewares/rateLimiter");
const logger = require("./utils/logger");

const app = express();

// Global Security Early-middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(globalLimiter);
app.use(express.json());

// Webhooks must be registered BEFORE global rate limiters if any,
// and sometimes need raw body parsing (though Razorpay works with JSON)
app.use("/api/webhooks", webhookRoutes);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/payments", paymentLimiter, paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/instructor", instructorRoutes);

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            status: "OK",
            service: "EduStream Backend",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Health check failed: ${error.message}`);
        res.status(503).json({
            status: "Service Unavailable",
            error: "Infrastructure degradation detected"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT}`);

    try {
        await pool.query("SELECT 1");
        logger.info("✅ Database connection verified on startup");

        // Seed default users (admin and instructor)
        await seedDefaultUsers();
    } catch (err) {
        logger.error(`❌ Failed to verify database on startup: ${err.message}`);
    }
});
