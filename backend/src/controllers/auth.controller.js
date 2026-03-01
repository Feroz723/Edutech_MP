const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const client = new OAuth2Client();

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Google token required" });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Check if user exists
        let userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        let user;

        if (userResult.rows.length === 0) {
            // Create new user (default role is student)
            const newUser = await pool.query(
                "INSERT INTO users (email, name, role) VALUES ($1, $2, 'student') RETURNING *",
                [email, name]
            );
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
        }

        // Create JWT
        const appToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(200).json({
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Authentication failed" });
    }
};

// Email/Password Registration
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password, and name are required" });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = await pool.query(
            "INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, 'student') RETURNING *",
            [email, name, hashedPassword]
        );

        const user = newUser.rows[0];

        // Create JWT
        const appToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(201).json({
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
    }
};

// Email/Password Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user exists
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = userResult.rows[0];

        // Check if user has a password (might be Google-only user)
        if (!user.password) {
            return res.status(401).json({ message: "Please login with Google" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT
        const appToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(200).json({
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            `SELECT u.id, u.email, u.name, u.role, u.notif_course_updates, u.notif_deadlines, u.notif_community,
                    p.institute_name, p.qualification, p.city, p.state, p.contact_number
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [userId]
        );

        const user = result.rows[0];
        const isProfileComplete = !!(
            user.institute_name &&
            user.qualification &&
            user.city &&
            user.state &&
            user.contact_number
        );

        res.status(200).json({ ...user, isProfileComplete });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, institute_name, qualification, city, state, contact_number } = req.body;

        // 1. Update core user info if name provided
        if (name) {
            await pool.query(
                "UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2",
                [name, userId]
            );
        }

        // 2. Fetch current user for JWT (ensures name is correct regardless of if it was updated)
        const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        const user = userRes.rows[0];

        // 3. Update or create extended profile info
        await pool.query(
            `INSERT INTO user_profiles (user_id, institute_name, qualification, city, state, contact_number)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id) DO UPDATE SET
                institute_name = EXCLUDED.institute_name,
                qualification = EXCLUDED.qualification,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                contact_number = EXCLUDED.contact_number`,
            [userId, institute_name, qualification, city, state, contact_number]
        );

        // Create new JWT with updated info
        const appToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(200).json({
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

exports.updateNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseUpdates, deadlines, community } = req.body;

        await pool.query(
            `UPDATE users SET 
                notif_course_updates = $1, 
                notif_deadlines = $2, 
                notif_community = $3, 
                updated_at = NOW() 
            WHERE id = $4`,
            [courseUpdates, deadlines, community, userId]
        );

        res.status(200).json({ message: "Notification preferences updated" });
    } catch (error) {
        console.error("Update notifications error:", error);
        res.status(500).json({ message: "Failed to update notification preferences" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new passwords are required" });
        }

        // Get user's current hashed password
        const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
        const user = userResult.rows[0];

        if (!user.password) {
            return res.status(400).json({ message: "User does not have a local password (Google Login)" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [hashedNewPassword, userId]);

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};

// Dev only: Change user role for testing
exports.changeRole = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { role } = req.body;

        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Use: student, instructor, or admin" });
        }

        const result = await pool.query(
            "UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [role, userId]
        );

        const user = result.rows[0];

        // Create instructor profile if becoming instructor
        if (role === 'instructor') {
            await pool.query(
                "INSERT INTO instructor_profiles (user_id, expertise) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING",
                [userId, "General"]
            );
        }

        // Create new JWT with updated role
        const appToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        res.status(200).json({
            message: `Role changed to ${role}`,
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Change role error:", error);
        res.status(500).json({ message: "Failed to change role" });
    }
};
