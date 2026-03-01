const pool = require("../config/db");

exports.createOrder = async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ message: "Course ID required" });
    }

    try {
        // Check if course exists and is published
        const courseResult = await pool.query(
            "SELECT * FROM courses WHERE id = $1 AND is_published = TRUE",
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: "Course not available" });
        }

        const course = courseResult.rows[0];

        // Prevent instructor buying own course
        if (course.instructor_id === userId) {
            return res.status(400).json({ message: "Cannot purchase your own course" });
        }

        // Prevent duplicate completed purchase
        const existingPurchase = await pool.query(
            `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = $1
       AND oi.course_id = $2
       AND o.status = 'completed'`,
            [userId, courseId]
        );

        if (existingPurchase.rows.length > 0) {
            return res.status(400).json({ message: "Course already purchased" });
        }

        await pool.query("BEGIN");

        // Create order
        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
            [userId, course.price]
        );

        const order = orderResult.rows[0];

        // Create order item
        await pool.query(
            `INSERT INTO order_items (order_id, course_id, price)
       VALUES ($1, $2, $3)`,
            [order.id, courseId, course.price]
        );

        await pool.query("COMMIT");

        res.status(201).json({
            message: "Order created",
            orderId: order.id,
            amount: course.price,
            status: order.status,
        });

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Create order error:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

exports.getMyOrders = async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            `SELECT o.*, oi.course_id, c.title as course_title, c.instructor_id
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN courses c ON oi.course_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
            [userId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Fetch my orders error:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

exports.refundOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        await pool.query("BEGIN");

        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE id = $1",
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orderResult.rows[0];

        if (order.status !== "completed") {
            return res.status(400).json({ message: "Only completed orders can be refunded" });
        }

        // 1. Update order status
        await pool.query(
            "UPDATE orders SET status = 'refunded' WHERE id = $1",
            [orderId]
        );

        // 2. Insert reversal entry in ledger
        const earningResult = await pool.query(
            "SELECT * FROM instructor_earnings WHERE order_id = $1",
            [orderId]
        );

        if (earningResult.rows.length > 0) {
            const e = earningResult.rows[0];

            // Reversal entry
            await pool.query(
                `INSERT INTO instructor_earnings 
                (instructor_id, course_id, student_id, order_id, gross_amount, platform_fee, instructor_share)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [e.instructor_id, e.course_id, e.student_id, `REFUND-${orderId}`, -e.gross_amount, -e.platform_fee, -e.instructor_share]
            );

            // 3. Update instructor profile balance
            await pool.query(
                `UPDATE instructor_profiles 
                SET total_earnings = total_earnings - $1 
                WHERE user_id = $2`,
                [e.instructor_share, e.instructor_id]
            );
        }

        await pool.query("COMMIT");
        res.status(200).json({ message: "Order refunded successfully" });

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Refund error:", error);
        res.status(500).json({ message: "Failed to process refund" });
    }
};

// Verify if user has access to a course
exports.verifyAccess = async (req, res) => {
    const userId = req.user?.userId;
    const { courseId } = req.params;

    try {
        // Check if user is the instructor of the course
        const courseCheck = await pool.query(
            "SELECT instructor_id FROM courses WHERE id = $1",
            [courseId]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ hasAccess: false, message: "Course not found" });
        }

        // Instructor has access to their own course
        if (courseCheck.rows[0].instructor_id === userId) {
            return res.status(200).json({ hasAccess: true, reason: "instructor" });
        }

        // Check for completed purchase
        const purchaseCheck = await pool.query(
            `SELECT o.id FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1
             AND oi.course_id = $2
             AND o.status = 'completed'`,
            [userId, courseId]
        );

        if (purchaseCheck.rows.length > 0) {
            return res.status(200).json({ hasAccess: true, reason: "purchased" });
        }

        res.status(200).json({ hasAccess: false, message: "Course not purchased" });

    } catch (error) {
        console.error("Verify access error:", error);
        res.status(500).json({ hasAccess: false, message: "Failed to verify access" });
    }
};

// Mock purchase for testing (completes order without payment)
exports.mockPurchase = async (req, res) => {
    const userId = req.user.userId;
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ message: "Course ID required" });
    }

    try {
        // Check if course exists
        const courseResult = await pool.query(
            "SELECT * FROM courses WHERE id = $1",
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = courseResult.rows[0];

        // Prevent instructor buying own course
        if (course.instructor_id === userId) {
            return res.status(400).json({ message: "Cannot purchase your own course" });
        }

        // Check for existing purchase
        const existingPurchase = await pool.query(
            `SELECT o.id FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = $1
             AND oi.course_id = $2
             AND o.status = 'completed'`,
            [userId, courseId]
        );

        if (existingPurchase.rows.length > 0) {
            return res.status(400).json({ message: "Course already purchased" });
        }

        await pool.query("BEGIN");

        // Create completed order directly
        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, total_amount, status)
             VALUES ($1, $2, 'completed')
             RETURNING *`,
            [userId, course.price]
        );

        const order = orderResult.rows[0];

        // Create order item
        await pool.query(
            `INSERT INTO order_items (order_id, course_id, price)
             VALUES ($1, $2, $3)`,
            [order.id, courseId, course.price]
        );

        // Calculate earnings (70% instructor, 30% platform)
        const platformFeePercent = 0.30;
        const platformFee = Math.round(course.price * platformFeePercent);
        const instructorShare = course.price - platformFee;

        // Record instructor earnings
        await pool.query(
            `INSERT INTO instructor_earnings 
             (instructor_id, course_id, student_id, order_id, gross_amount, platform_fee, instructor_share)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [course.instructor_id, courseId, userId, order.id, course.price, platformFee, instructorShare]
        );

        // Update instructor total earnings
        await pool.query(
            `UPDATE instructor_profiles 
             SET total_earnings = total_earnings + $1 
             WHERE user_id = $2`,
            [instructorShare, course.instructor_id]
        );

        await pool.query("COMMIT");

        res.status(200).json({
            message: "Mock purchase completed successfully",
            orderId: order.id,
            hasAccess: true
        });

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Mock purchase error:", error);
        res.status(500).json({ message: "Failed to complete mock purchase" });
    }
};
