const paytm = require("./paytm.service");

function getPaymentProvider() {
    const provider = (process.env.PAYMENT_PROVIDER || "paytm").toLowerCase();

    if (provider === "paytm") {
        return { provider, service: paytm };
    }

    throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
}

module.exports = {
    getPaymentProvider,
};
