import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();
router.use(authenticateToken);
// Middleware to check if user is admin or staff
const isAdminOrStaff = (req, res, next) => {
    if (req.user.role === "ADMIN" || req.user.role === "STAFF") {
        next();
    }
    else {
        res.status(403).json({ message: "Access denied" });
    }
};
// GET /api/feedback
router.get("/", isAdminOrStaff, async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            include: {
                member: {
                    select: {
                        name: true,
                        memberId: true,
                        phone: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(feedbacks);
    }
    catch (error) {
        console.error("Fetch feedbacks error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/feedback/:id
router.patch("/:id", isAdminOrStaff, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const feedback = await prisma.feedback.update({
            where: { id },
            data: { status }
        });
        res.json(feedback);
    }
    catch (error) {
        console.error("Update feedback error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// DELETE /api/feedback/:id
router.delete("/:id", isAdminOrStaff, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.feedback.delete({
            where: { id }
        });
        res.json({ message: "Feedback deleted successfully" });
    }
    catch (error) {
        console.error("Delete feedback error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export default router;
