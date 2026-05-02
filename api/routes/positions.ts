import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// Get all positions
router.get("/", async (req, res) => {
  try {
    const positions = await prisma.$queryRaw`SELECT * FROM Position ORDER BY createdAt DESC`;
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching positions" });
  }
});

// Create new position
router.post("/", async (req, res) => {
  const { name } = req.body;
  try {
    const existing: any[] = await prisma.$queryRaw`SELECT * FROM Position WHERE name = ${name}`;
    if (existing.length > 0) return res.status(400).json({ message: "Position already exists" });

    // CUID generation is normally done by prisma, we'll just use a random string or time-based ID for raw queries
    const id = "pos_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    await prisma.$executeRaw`INSERT INTO Position (id, name, createdAt, updatedAt) VALUES (${id}, ${name}, NOW(), NOW())`;
    
    const newPosition: any[] = await prisma.$queryRaw`SELECT * FROM Position WHERE id = ${id}`;
    res.status(201).json(newPosition[0]);
  } catch (error) {
    res.status(500).json({ message: "Error creating position" });
  }
});

// Update position
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    await prisma.$executeRaw`UPDATE Position SET name = ${name}, updatedAt = NOW() WHERE id = ${id}`;
    const updated: any[] = await prisma.$queryRaw`SELECT * FROM Position WHERE id = ${id}`;
    res.json(updated[0]);
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('Duplicate entry')) {
      return res.status(400).json({ message: "Position name already exists" });
    }
    res.status(500).json({ message: "Error updating position" });
  }
});

// Delete position
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$executeRaw`DELETE FROM Position WHERE id = ${id}`;
    res.json({ message: "Position deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting position" });
  }
});

export default router;
