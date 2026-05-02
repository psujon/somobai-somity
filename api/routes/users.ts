import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = express.Router();
router.use(authenticateToken);

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Create new user
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;
  
  try {
    const dataToUpdate: any = { name, email, role };
    // Only update password if provided
    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ message: "Email already in use" });
    res.status(500).json({ message: "Error updating user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Prevent deleting the last admin
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    
    if (userToDelete?.role === "ADMIN" && adminCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last admin user" });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

export default router;
