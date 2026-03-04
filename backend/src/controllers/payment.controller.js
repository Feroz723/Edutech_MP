const pool = require("../config/db");
const logger = require("../utils/logger");
const { getPaymentProvider } = require("../services/payments");

const PLATFORM_COMMISSION = 0.2; // 20%

async function completeOrderAndLedger({ orderId, userId, providerName, gatewayTxnId = null, rawStatus = "TXN_SUCCESS", payload = {} }) {
    // Idempotency check
    const orderResult = await pool.query(
        "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
        [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
        return { status: 404, body: { message: "Order not found" } };
    }

    const order = orderResult.rows[0];

    if (order.status === "completed") {
        return { status: 200, body: { message: "Order already completed successfully" } };
    }

    if (order.status === "failed" || order.status === "refunded") {
        return { status: 400, body: { message: `Order cannot transition from ${order.status}` } };
    }

    await pool.query("BEGIN");

    await pool.query(
        `UPDATE orders
         SET status = 'completed',
             payment_provider = $1,
             gateway_txn_id = COALESCE($2, gateway_txn_id),
             gateway_order_id = $3,
             payment_status_raw = $4,
             payment_verified_at = CURRENT_TIMESTAMP,
             gateway_payload = $5
         WHERE id = $6 AND status = 'pending'`,
        [providerName, gatewayTxnId, orderId, rawStatus, JSON.stringify(payload), orderId]
    );

    const itemResult = await pool.query(
        `SELECT oi.course_id, oi.price, c.instructor_id
         FROM order_items oi
         JOIN courses c ON oi.course_id = c.id
         WHERE oi.order_id = $1`,
        [orderId]
    );

    if (itemResult.rows.length === 0) {
        throw new Error("Order items not found");
    }

    const item = itemResult.rows[0];
    const gross = Number(item.price);
    const platformFee = gross * PLATFORM_COMMISSION;
    const instructorShare = gross - platformFee;

    // The UNIQUE(order_id) constraint in instructor_earnings ensures ledger-level idempotency.
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

    return { status: 200, body: { message: "Payment verified & revenue recorded" } };
}

async function markOrderFailed({ orderId, userId, providerName, gatewayTxnId = null, rawStatus = "TXN_FAILURE", payload = {} }) {
    await pool.query(
        `UPDATE orders
         SET status = CASE WHEN status = 'pending' THEN 'failed' ELSE status END,
             payment_provider = COALESCE(payment_provider, $1),
             gateway_txn_id = COALESCE($2, gateway_txn_id),
             gateway_order_id = COALESCE(gateway_order_id, $3),
             payment_status_raw = $4,
             gateway_payload = $5
         WHERE id = $6 AND user_id = $7`,
        [providerName, gatewayTxnId, orderId, rawStatus, JSON.stringify(payload), orderId, userId]
    );
}

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

        const { provider, service } = getPaymentProvider();
        const paymentSession = await service.initiateTransaction({
            orderId,
            amount: order.total_amount,
            userId,
        });

        await pool.query(
            `UPDATE orders
             SET payment_provider = $1,
                 gateway_order_id = $2,
                 payment_status_raw = 'INITIATED'
             WHERE id = $3`,
            [provider, orderId, orderId]
        );

        res.status(200).json(paymentSession);
    } catch (error) {
        logger.error(`Payment creation error: ${error.message}`);
        res.status(500).json({ message: "Failed to initiate payment" });
    }
};

exports.verifyPayment = async (req, res) => {
    const userId = req.user.userId;
    const { orderId, txnId, amount, checksum, paytmParams } = req.body;

    try {
        const { provider, service } = getPaymentProvider();

        if (!orderId) {
            return res.status(400).json({ message: "orderId is required" });
        }

        if (paytmParams && checksum) {
            const verified = service.verifyCallbackChecksum({ ...paytmParams, CHECKSUMHASH: checksum });
            if (!verified) {
                logger.warn(`Checksum verification failed for order ${orderId}`);
                return res.status(400).json({ message: "Invalid checksum" });
            }
        }

        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderResult.rows[0];

        if (amount && Number(amount).toFixed(2) !== Number(order.total_amount).toFixed(2)) {
            return res.status(400).json({ message: "Amount mismatch detected" });
        }

        const statusBody = await service.getTransactionStatus({ orderId });
        const mappedStatus = service.mapStatus(statusBody.resultInfo?.resultStatus || statusBody.txnStatus);
        const resolvedTxnId = txnId || statusBody.txnId || statusBody.TXNID || null;

        if (mappedStatus === "success") {
            const result = await completeOrderAndLedger({
                orderId,
                userId,
                providerName: provider,
                gatewayTxnId: resolvedTxnId,
                rawStatus: statusBody.txnStatus || "TXN_SUCCESS",
                payload: statusBody,
            });
            return res.status(result.status).json(result.body);
        }

        await markOrderFailed({
            orderId,
            userId,
            providerName: provider,
            gatewayTxnId: resolvedTxnId,
            rawStatus: statusBody.txnStatus || "TXN_FAILURE",
            payload: statusBody,
        });

        return res.status(400).json({ message: "Payment not successful", gatewayStatus: statusBody.txnStatus || "UNKNOWN" });
    } catch (error) {
        await pool.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
            logger.info(`Ledger idempotency: Duplicate earning avoided for Order: ${req.body.orderId}`);
            return res.status(200).json({ message: "Order already in ledger" });
        }

        logger.error(`Payment verification failed: ${error.message}`);
        return res.status(500).json({ message: "Payment verification failed" });
    }
};

exports.handlePaytmWebhook = async (req, res) => {
    try {
        const payload = req.body || {};
        const orderId = payload.ORDERID;
        const txnId = payload.TXNID;
        const txnStatus = payload.STATUS;

        if (!orderId) {
            return res.status(400).json({ message: "Invalid callback payload" });
        }

        const orderResult = await pool.query(
            "SELECT user_id FROM orders WHERE id = $1",
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const userId = orderResult.rows[0].user_id;

        const { provider, service } = getPaymentProvider();

        const validChecksum = service.verifyCallbackChecksum(payload);
        if (!validChecksum) {
            logger.warn(`Paytm callback checksum mismatch for order ${orderId}`);
            return res.status(400).json({ message: "Invalid callback checksum" });
        }

        const statusBody = await service.getTransactionStatus({ orderId });
        const mappedStatus = service.mapStatus(statusBody.resultInfo?.resultStatus || statusBody.txnStatus || txnStatus);

        if (mappedStatus === "success") {
            await completeOrderAndLedger({
                orderId,
                userId,
                providerName: provider,
                gatewayTxnId: txnId || statusBody.txnId || null,
                rawStatus: statusBody.txnStatus || txnStatus || "TXN_SUCCESS",
                payload: { callback: payload, status: statusBody },
            });
        } else {
            await markOrderFailed({
                orderId,
                userId,
                providerName: provider,
                gatewayTxnId: txnId || statusBody.txnId || null,
                rawStatus: statusBody.txnStatus || txnStatus || "TXN_FAILURE",
                payload: { callback: payload, status: statusBody },
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(`${frontendUrl}/payments/callback?orderId=${encodeURIComponent(orderId)}&status=${encodeURIComponent(mappedStatus)}`);
    } catch (error) {
        logger.error(`Paytm webhook handling failed: ${error.message}`);
        return res.status(500).json({ message: "Webhook processing failed" });
    }
};


exports.getPaymentStatus = async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.params;

    try {
        const orderResult = await pool.query(
            `SELECT id, status, total_amount, payment_provider, payment_status_raw, payment_verified_at
             FROM orders WHERE id = $1 AND user_id = $2`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json(orderResult.rows[0]);
    } catch (error) {
        logger.error(`Payment status fetch failed: ${error.message}`);
        return res.status(500).json({ message: "Failed to fetch payment status" });
    }
};
