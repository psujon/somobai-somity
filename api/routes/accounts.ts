import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Get all vouchers
router.get("/", async (req, res) => {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { date: "desc" },
    });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching vouchers" });
  }
});

// Create a voucher
router.post("/", async (req, res) => {
  const { type, category, amount, description } = req.body;
  const numAmount = parseFloat(amount);

  if (!type || !category || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const count = await prisma.voucher.count();
    const voucherNo = `V-${String(count + 1).padStart(5, '0')}`;

    const voucher = await prisma.voucher.create({
      data: {
        voucherNo,
        type,
        category,
        amount: numAmount,
        description,
      },
    });

    res.status(201).json(voucher);
  } catch (error) {
    res.status(500).json({ message: "Server error creating voucher" });
  }
});

export default router;
