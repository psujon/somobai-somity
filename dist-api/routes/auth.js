import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { sendSms } from "../utils/sms.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();
// Temporary store for login OTPs
const otpStore = new Map();
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "super-secret-jwt-key", { expiresIn: "1d" });
        // ১. লগইন অ্যাক্টিভিটি সেভ করা
        try {
            const now = new Date();
            // BD সময় এডজাস্টমেন্ট (GMT+6)
            const bdTimeObj = new Date(now.getTime() + (6 * 60 * 60 * 1000));
            const bdTimeStr = now.toLocaleString("en-GB", {
                timeZone: "Asia/Dhaka",
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: true
            });
            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    type: "LOGIN",
                    loginAt: bdTimeObj,
                    loginTime: bdTimeStr,
                    ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString() || null,
                    userAgent: req.headers["user-agent"] || null,
                },
            });
        }
        catch (logErr) {
            console.error("Activity logging failed:", logErr);
        }
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// POST /api/auth/logout - লগআউট অ্যাক্টিভিটি ট্র্যাক করা
router.post("/logout", async (req, res) => {
    const { userId } = req.body;
    if (!userId)
        return res.status(400).json({ message: "User ID required" });
    try {
        const now = new Date();
        const bdTimeObj = new Date(now.getTime() + (6 * 60 * 60 * 1000));
        const bdTimeStr = now.toLocaleString("en-GB", {
            timeZone: "Asia/Dhaka",
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true
        });
        await prisma.activityLog.create({
            data: {
                userId: userId,
                type: "LOGOUT",
                loginAt: bdTimeObj,
                loginTime: bdTimeStr,
                ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString() || null,
                userAgent: req.headers["user-agent"] || null,
            },
        });
        res.json({ message: "Logout logged" });
    }
    catch (err) {
        console.error("Logout logging failed:", err);
        res.status(500).json({ message: "Logging failed" });
    }
});
router.get("/me", async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Access Denied" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "super-secret-jwt-key");
        if (decoded.role === "MEMBER") {
            const member = await prisma.member.findFirst({
                where: { phone: decoded.id },
            });
            if (!member)
                return res.status(404).json({ message: "Member not found" });
            return res.json({
                id: decoded.id,
                name: member.name,
                email: decoded.email,
                role: "MEMBER"
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json(user);
    }
    catch (err) {
        res.status(403).json({ message: "Invalid Token" });
    }
});
router.post("/member-login", async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ message: "মোবাইল নম্বর প্রয়োজন" });
    }
    try {
        const trimmedPhone = phone.trim();
        // Check if member exists
        const member = await prisma.member.findFirst({
            where: { phone: trimmedPhone }
        });
        if (!member) {
            return res.status(400).json({ message: "এই ফোন নম্বরে কোনো সদস্য খুঁজে পাওয়া যায়নি।" });
        }
        // Generate 4-digit OTP code
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
        // Store in-memory
        otpStore.set(trimmedPhone, { otp, expiresAt });
        // Print to console so developers can log in without SMS credits
        console.log(`[OTP Verification] Generated OTP for ${trimmedPhone}: ${otp} (Expires at ${expiresAt.toLocaleTimeString()})`);
        // Send via SMS
        const message = `আপনার লগইন কোডটি হলো: ${otp}`;
        await sendSms(trimmedPhone, message);
        res.json({ message: "ওটিপি কোড পাঠানো হয়েছে" });
    }
    catch (error) {
        console.error("Member login error:", error);
        res.status(500).json({ message: "সার্ভার এরর" });
    }
});
router.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ message: "ফোন নম্বর এবং ওটিপি কোড প্রয়োজন" });
    }
    try {
        const trimmedPhone = phone.trim();
        const trimmedOtp = otp.trim();
        const storedData = otpStore.get(trimmedPhone);
        if (!storedData || storedData.otp !== trimmedOtp) {
            return res.status(400).json({ message: "ভুল ওটিপি কোড।" });
        }
        if (new Date() > storedData.expiresAt) {
            otpStore.delete(trimmedPhone);
            return res.status(400).json({ message: "ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে।" });
        }
        // OTP verified, clear it
        otpStore.delete(trimmedPhone);
        // Get member details
        const member = await prisma.member.findFirst({
            where: { phone: trimmedPhone }
        });
        if (!member) {
            return res.status(400).json({ message: "সদস্য পাওয়া যায়নি।" });
        }
        const token = jwt.sign({ id: trimmedPhone, email: member.email || "", role: "MEMBER" }, process.env.JWT_SECRET || "super-secret-jwt-key", { expiresIn: "1d" });
        res.json({
            token,
            user: {
                id: trimmedPhone,
                name: member.name,
                email: member.email || "",
                role: "MEMBER",
            },
        });
    }
    catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ message: "সার্ভার এরর" });
    }
});
// POST /api/auth/change-password - Change admin password
router.put("/change-password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "বর্তমান এবং নতুন পাসওয়ার্ড উভয়ই প্রয়োজন।" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "ইউজার পাওয়া যায়নি।" });
        }
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "বর্তমান পাসওয়ার্ড ভুল।" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.json({ message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।" });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "সার্ভার এরর" });
    }
});
export default router;
