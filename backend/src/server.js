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
const {
    globalLimiter,
    authLimiter,
    orderLimiter,
    paymentLimiter,
    webhookLimiter,
} = require("./middlewares/rateLimiter");
const logger = require("./utils/logger");

const app = express();

const getAllowedOrigins = () => {
    const configured = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
        : [];

    const fallback = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ["http://localhost:3000"];
    return configured.length ? configured : fallback;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
    origin(origin, callback) {
        // Non-browser clients (curl/postman/server-to-server) may omit Origin.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
};

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

// Global Security Early-middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Webhooks must be registered early and with dedicated limiters.
app.use("/api/webhooks", webhookLimiter, webhookRoutes);

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


app.use((err, req, res, next) => {
    if (err && err.message === "CORS origin not allowed") {
        return res.status(403).json({ message: "Origin not allowed by CORS policy" });
    }

    return next(err);
});

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            status: "OK",
            service: "EduStream Backend",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error(`Health check failed: ${error.message}`);
        res.status(503).json({
            status: "Service Unavailable",
            error: "Infrastructure degradation detected",
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
