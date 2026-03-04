const crypto = require("crypto");

const IV = "@@@@&&&&####$$$$";
const isProd = process.env.PAYTM_ENV === "production";
const PAYTM_HOST = isProd ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";

const requiredEnv = ["PAYTM_MID", "PAYTM_MERCHANT_KEY", "PAYTM_WEBSITE"];

function assertEnv() {
    const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key].startsWith("YOUR_"));
    if (missing.length) {
        throw new Error(`Missing Paytm env vars: ${missing.join(", ")}`);
    }
}

function randomSalt(length = 4) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function paytmEncrypt(input, key) {
    const cipher = crypto.createCipheriv("aes-128-cbc", key, IV);
    return Buffer.concat([cipher.update(input, "utf8"), cipher.final()]).toString("base64");
}

function paytmDecrypt(checksum, key) {
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, IV);
    return Buffer.concat([decipher.update(checksum, "base64"), decipher.final()]).toString("utf8");
}

function generateSignature(bodyString, key) {
    const salt = randomSalt(4);
    const hash = crypto.createHash("sha256").update(`${bodyString}|${salt}`).digest("hex");
    return paytmEncrypt(`${hash}${salt}`, key);
}

function verifySignature(payloadObj, key, checksum) {
    try {
        const payloadString = JSON.stringify(payloadObj);
        const paytmHash = paytmDecrypt(checksum, key);
        const salt = paytmHash.slice(-4);
        const hash = paytmHash.slice(0, paytmHash.length - 4);
        const calculated = crypto.createHash("sha256").update(`${payloadString}|${salt}`).digest("hex");
        return hash === calculated;
    } catch {
        return false;
    }
}

function amountToPaytmValue(amount) {
    return Number(amount).toFixed(2);
}

/**
 * Extract QR / deep-link data from Paytm response body.
 * Paytm may return it under different keys across API versions.
 */
function extractQrData(body) {
    // Try all known field names
    const raw =
        body?.qrCode ||
        body?.qrData ||
        body?.deepLink ||
        body?.deepLinkInfo?.deepLink ||
        null;
    return raw || null;
}

function extractQrExpiry(body) {
    const raw =
        body?.qrCodeExpiry ||
        body?.qrDataExpiry ||
        body?.deepLinkInfo?.expiry ||
        null;
    if (!raw) return null;
    // Paytm may return epoch seconds or ISO string
    const num = Number(raw);
    if (!Number.isNaN(num) && num > 1e9) return new Date(num * 1000).toISOString();
    return raw;
}

async function initiateTransaction({ orderId, amount, userId }) {
    assertEnv();

    const callbackUrl = process.env.PAYTM_CALLBACK_URL
        || `${process.env.BACKEND_URL || "http://localhost:5000"}/api/webhooks/paytm`;

    const payloadBody = {
        requestType: "Payment",
        mid: process.env.PAYTM_MID,
        websiteName: process.env.PAYTM_WEBSITE,
        orderId,
        callbackUrl,
        txnAmount: {
            value: amountToPaytmValue(amount),
            currency: "INR",
        },
        userInfo: {
            custId: String(userId),
        },
    };

    const signature = generateSignature(JSON.stringify(payloadBody), process.env.PAYTM_MERCHANT_KEY);

    const payload = {
        body: payloadBody,
        head: { signature },
    };

    const response = await fetch(
        `${PAYTM_HOST}/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );

    const data = await response.json();

    if (!response.ok || data?.body?.resultInfo?.resultStatus !== "S") {
        const message = data?.body?.resultInfo?.resultMsg || "Failed to initiate Paytm transaction";
        throw new Error(message);
    }

    const body = data.body || {};

    return {
        provider: "paytm",
        txnToken: body.txnToken,
        orderId,
        amount: amountToPaytmValue(amount),
        mid: process.env.PAYTM_MID,
        callbackUrl,
        environment: isProd ? "production" : "staging",
        paymentUrl: `${PAYTM_HOST}/theia/api/v1/showPaymentPage`,
        qrData: extractQrData(body),
        qrExpiresAt: extractQrExpiry(body),
    };
}

async function getTransactionStatus({ orderId }) {
    assertEnv();

    const body = {
        mid: process.env.PAYTM_MID,
        orderId,
    };

    const signature = generateSignature(JSON.stringify(body), process.env.PAYTM_MERCHANT_KEY);

    const payload = {
        body,
        head: { signature },
    };

    const response = await fetch(`${PAYTM_HOST}/v3/order/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error("Paytm status API failed");
    }

    return data.body || {};
}

function verifyCallbackChecksum(payload) {
    assertEnv();
    const checksum = payload.CHECKSUMHASH;
    if (!checksum) return false;

    const data = { ...payload };
    delete data.CHECKSUMHASH;

    return verifySignature(data, process.env.PAYTM_MERCHANT_KEY, checksum);
}

function mapStatus(status) {
    if (status === "TXN_SUCCESS") return "success";
    if (status === "TXN_FAILURE" || status === "TXN_FAILED") return "failed";
    return "pending";
}

module.exports = {
    initiateTransaction,
    getTransactionStatus,
    verifyCallbackChecksum,
    mapStatus,
};
