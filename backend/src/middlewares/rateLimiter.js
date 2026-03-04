const rateLimit = require("express-rate-limit");

const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildLimiter = ({
    windowMs,
    max,
    message,
    keyGenerator,
}) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
        res.status(429).json({
            message,
            retryAfterSeconds: Math.ceil(windowMs / 1000),
        });
    },
});

const byIp = (req) => req.ip;
const byUserOrIp = (req) => req.user?.userId || req.ip;

const globalWindowMs = toInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 60 * 1000);
const globalMax = toInt(process.env.RATE_LIMIT_GLOBAL_MAX, 100);

const authWindowMs = toInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000);
const authMax = toInt(process.env.RATE_LIMIT_AUTH_MAX, 20);

const orderWindowMs = toInt(process.env.RATE_LIMIT_ORDER_WINDOW_MS, 60 * 60 * 1000);
const orderMax = toInt(process.env.RATE_LIMIT_ORDER_MAX, 20);

const paymentWindowMs = toInt(process.env.RATE_LIMIT_PAYMENT_WINDOW_MS, 15 * 60 * 1000);
const paymentMax = toInt(process.env.RATE_LIMIT_PAYMENT_MAX, 30);

const webhookWindowMs = toInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW_MS, 60 * 1000);
const webhookMax = toInt(process.env.RATE_LIMIT_WEBHOOK_MAX, 120);

exports.globalLimiter = buildLimiter({
    windowMs: globalWindowMs,
    max: globalMax,
    message: "Too many requests from this IP. Please retry shortly.",
    keyGenerator: byIp,
});

exports.authLimiter = buildLimiter({
    windowMs: authWindowMs,
    max: authMax,
    message: "Too many authentication attempts. Please retry later.",
    keyGenerator: byIp,
});

exports.orderLimiter = buildLimiter({
    windowMs: orderWindowMs,
    max: orderMax,
    message: "Order request limit reached. Please retry later.",
    keyGenerator: byUserOrIp,
});

exports.paymentLimiter = buildLimiter({
    windowMs: paymentWindowMs,
    max: paymentMax,
    message: "Payment request limit reached. Please retry later.",
    keyGenerator: byUserOrIp,
});

exports.webhookLimiter = buildLimiter({
    windowMs: webhookWindowMs,
    max: webhookMax,
    message: "Webhook request limit reached. Please retry later.",
    keyGenerator: byIp,
});
