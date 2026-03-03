module.exports = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        // Admin retains governance-level access across protected routes
        if (req.user.role === "admin") {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        next();
    };
};
