import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// Get all member types
router.get("/", async (req, res) => {
  try {
    const types = await prisma.$queryRaw`SELECT * FROM MemberType ORDER BY createdAt DESC`;
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: "Error fetching member types" });
  }
});

// Create new member type
router.post("/", async (req, res) => {
  const { name } = req.body;
  try {
    const existing: any[] = await prisma.$queryRaw`SELECT * FROM MemberType WHERE name = ${name}`;
    if (existing.length > 0) return res.status(400).json({ message: "Member type already exists" });

    const id = "mtype_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    await prisma.$executeRaw`INSERT INTO MemberType (id, name, createdAt, updatedAt) VALUES (${id}, ${name}, NOW(), NOW())`;
    
    const newType: any[] = await prisma.$queryRaw`SELECT * FROM MemberType WHERE id = ${id}`;
    res.status(201).json(newType[0]);
  } catch (error) {
    res.status(500).json({ message: "Error creating member type" });
  }
});

// Update member type
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    await prisma.$executeRaw`UPDATE MemberType SET name = ${name}, updatedAt = NOW() WHERE id = ${id}`;
    const updated: any[] = await prisma.$queryRaw`SELECT * FROM MemberType WHERE id = ${id}`;
    res.json(updated[0]);
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('Duplicate entry')) {
      return res.status(400).json({ message: "Member type name already exists" });
    }
    res.status(500).json({ message: "Error updating member type" });
  }
});

// Delete member type
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$executeRaw`DELETE FROM MemberType WHERE id = ${id}`;
    res.json({ message: "Member type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting member type" });
  }
});

export default router;
