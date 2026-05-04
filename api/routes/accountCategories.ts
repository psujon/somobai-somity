import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// Get all account categories (optional ?type=INCOME|EXPENSE|INVESTMENT filter)
router.get("/", async (req, res) => {
  const { type } = req.query;
  try {
    let categories: any[];
    if (type) {
      categories = await prisma.$queryRawUnsafe(
        `SELECT * FROM accountcategory WHERE type = ? ORDER BY name ASC`,
        type
      );
    } else {
      categories = await prisma.$queryRawUnsafe(
        `SELECT * FROM accountcategory ORDER BY type ASC, name ASC`
      );
    }
    res.json(categories);
  } catch (error) {
    console.error("Error fetching account categories:", error);
    res.status(500).json({ message: "Error fetching account categories" });
  }
});

// Create new account category
router.post("/", async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: "নাম ও টাইপ আবশ্যক" });

  try {
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM accountcategory WHERE name = ?`,
      name
    );
    if (existing.length > 0) return res.status(400).json({ message: "এই নামে ক্যাটাগরী ইতিমধ্যে আছে" });

    const id = "acat_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO accountcategory (id, name, type, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
      id, name, type
    );

    const created: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM accountcategory WHERE id = ?`,
      id
    );
    res.status(201).json(created[0]);
  } catch (error: any) {
    console.error("Error creating account category:", error);
    if (error.message?.includes("Duplicate entry")) {
      return res.status(400).json({ message: "এই নামে ক্যাটাগরী ইতিমধ্যে আছে" });
    }
    res.status(500).json({ message: "Error creating account category" });
  }
});

// Update account category
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE accountcategory SET name = ?, type = ?, updatedAt = NOW() WHERE id = ?`,
      name, type, id
    );
    const updated: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM accountcategory WHERE id = ?`,
      id
    );
    res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating account category:", error);
    if (error.message?.includes("Duplicate entry")) {
      return res.status(400).json({ message: "এই নামে ক্যাটাগরী ইতিমধ্যে আছে" });
    }
    res.status(500).json({ message: "Error updating account category" });
  }
});

// Delete account category
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM accountcategory WHERE id = ?`,
      id
    );
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting account category:", error);
    res.status(500).json({ message: "Error deleting account category" });
  }
});

export default router;
