const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../config/db");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLATFORM_COMMISSION = 0.2; // 20%

exports.createPayment = async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.body;

    try {
        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderResult.rows[0];

        if (order.status !== "pending") {
            return res.status(400).json({ message: "Order already processed" });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Number(order.total_amount) * 100,
            currency: "INR",
            receipt: order.id,
        });

        res.status(200).json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error("Payment creation error:", error);
        res.status(500).json({ message: "Failed to initiate payment" });
    }
};

exports.verifyPayment = async (req, res) => {
    const userId = req.user.userId;
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
    } = req.body;

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            logger.warn(`Invalid payment signature attempt for Order: ${orderId}`);
            return res.status(400).json({ message: "Invalid signature" });
        }

        // Idempotency check: Is order already completed?
        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderResult.rows[0];

        if (order.status === "completed") {
            logger.info(`Idempotent request: Order ${orderId} already completed.`);
            return res.status(200).json({ message: "Order already completed successfully" });
        }

        await pool.query("BEGIN");

        await pool.query(
            "UPDATE orders SET status = 'completed' WHERE id = $1",
            [orderId]
        );

        const itemResult = await pool.query(
            `SELECT oi.course_id, oi.price, c.instructor_id, c.title as course_title
             FROM order_items oi
             JOIN courses c ON oi.course_id = c.id
             WHERE oi.order_id = $1`,
            [orderId]
        );

        const item = itemResult.rows[0];

        const gross = Number(item.price);
        const platformFee = gross * PLATFORM_COMMISSION;
        const instructorShare = gross - platformFee;

        // The UNIQUE (order_id) constraint provides DB-level idempotency safety
        await pool.query(
            `INSERT INTO instructor_earnings
             (instructor_id, course_id, student_id, order_id, gross_amount, platform_fee, instructor_share)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                item.instructor_id,
                item.course_id,
                userId,
                orderId,
                gross,
                platformFee,
                instructorShare,
            ]
        );

        await pool.query(
            `UPDATE instructor_profiles
             SET total_earnings = total_earnings + $1
             WHERE user_id = $2`,
            [instructorShare, item.instructor_id]
        );

        await pool.query("COMMIT");

        logger.info(`Payment successful for Order: ${orderId}, Student: ${userId}`);
        res.status(200).json({ message: "Payment verified & revenue recorded" });

    } catch (error) {
        await pool.query("ROLLBACK");
        if (error.code === '23505') { // Unique violation
            logger.info(`Ledger idempotency: Duplicate earning avoided for Order: ${orderId}`);
            return res.status(200).json({ message: "Order already in ledger" });
        }
        logger.error(`Payment verification failed: ${error.message}`);
        res.status(500).json({ message: "Payment verification failed" });
    }
};

exports.handleWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        logger.error("RAZORPAY_WEBHOOK_SECRET not configured");
        return res.status(500).json({ message: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (signature !== digest) {
        logger.warn("Razorpay webhook signature mismatch");
        return res.status(400).json({ message: "Invalid webhook secret" });
    }

    const event = req.body;

    if (event.event === "payment.captured") {
        const orderId = event.payload.payment.entity.notes.order_id || event.payload.payment.entity.order_id;

        logger.info(`Webhook: Payment captured for Order: ${orderId}`);

        // We can reuse the logic to mark as completed and record earnings if not already done
        // For simplicity in this demo, the frontend handle verifyPayment is the primary driver,
        // but real systems should use this webhook to ensure completion even if user closes tab.
    }

    res.status(200).json({ status: "ok" });
};
