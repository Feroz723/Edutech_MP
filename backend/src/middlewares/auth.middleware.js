const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log("Auth middleware: No authorization header");
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        console.log("Auth middleware: No token in header");
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        if (process.env.DEBUG_AUTH === "true") {
            console.log("Auth middleware: Verifying token...");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user is suspended
        const userCheck = await pool.query("SELECT is_suspended FROM users WHERE id = $1", [decoded.userId]);
        if (userCheck.rows.length > 0 && userCheck.rows[0].is_suspended) {
            console.log("Auth middleware: User suspended:", decoded.userId);
            return res.status(403).json({ message: "Account suspended. Contact support." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth middleware: Token verification failed!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", expiredAt: error.expiredAt });
        }
        return res.status(401).json({ message: "Invalid token", error: error.message });
    }
};
