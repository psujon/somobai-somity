import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Get all vouchers
router.get("/", async (req, res) => {
  const { type, category, memberId, amount, projectId } = req.query;

  const whereClause: any = {
    category: { not: "Savings Deposit" },
  };
  if (type) whereClause.type = type;
  if (category) whereClause.category = category;
  if (memberId) whereClause.memberId = memberId;
  if (projectId) whereClause.projectId = projectId;
  if (amount) {
    const numAmount = parseFloat(amount as string);
    if (!isNaN(numAmount)) {
      whereClause.amount = numAmount;
    }
  }

  try {
    const vouchers = await (prisma.voucher as any).findMany({
      take: 200,
      where: whereClause,
      include: {
        member: { select: { name: true, memberId: true } },
        savingsAccount: {
          include: { member: { select: { name: true, memberId: true } } }
        },
        loan: {
          include: { member: { select: { name: true, memberId: true } } }
        },
        project: { select: { id: true, name: true, code: true } }
      },
      orderBy: { id: "desc" },
    });
    res.json(vouchers);
  } catch (error) {
    console.error("Voucher fetch error:", error);
    res.status(500).json({ message: "Server error fetching vouchers" });
  }
});

async function getNextVoucherRef() {
  const lastVouchers = await prisma.voucher.findMany({
    where: {
      voucherRef: {
        startsWith: "V",
      },
    },
    select: {
      voucherRef: true,
    },
  });

  let maxNum = 1000000;
  for (const v of lastVouchers) {
    if (v.voucherRef) {
      const match = v.voucherRef.match(/^V(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  return `V${maxNum + 1}`;
}

// Create a voucher
router.post("/", async (req, res) => {
  const { type, category, amount, description, memberId, savingsAccountId, loanId, date, voucherNo, projectId } = req.body;
  const numAmount = parseFloat(amount);

  if (!type || !category || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const finalVoucherNo = voucherNo || null;
    const finalDate = date ? new Date(date) : new Date();
    const voucherRef = await getNextVoucherRef();

    const voucher = await (prisma.voucher as any).create({
      data: {
        voucherNo: finalVoucherNo,
        type,
        category,
        amount: numAmount,
        description,
        memberId: memberId || null,
        savingsAccountId: savingsAccountId || null,
        loanId: loanId || null,
        projectId: projectId || null,
        date: finalDate,
        voucherRef,
      },
      include: {
        member: { select: { name: true, memberId: true } },
        project: { select: { id: true, name: true, code: true } },
      }
    });

    res.status(201).json(voucher);
  } catch (error) {
    console.error("Voucher creation error:", error);
    res.status(500).json({ message: "Server error creating voucher" });
  }
});

// Update a voucher
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, category, amount, description, memberId, date, voucherNo, projectId } = req.body;
  const numAmount = parseFloat(amount);

  if (!type || !category || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    // Block editing savings deposit vouchers
    if (voucher.category === "Savings Deposit") {
      return res.status(400).json({ message: "Member deposit vouchers cannot be edited from here" });
    }

    const updatedVoucher = await (prisma.voucher as any).update({
      where: { id },
      data: {
        type,
        category,
        amount: numAmount,
        description,
        memberId: memberId || null,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        date: date ? new Date(date) : undefined,
        voucherNo: voucherNo || null,
      },
      include: {
        member: { select: { name: true, memberId: true } },
        project: { select: { id: true, name: true, code: true } },
      }
    });

    res.json(updatedVoucher);
  } catch (error) {
    console.error("Voucher update error:", error);
    res.status(500).json({ message: "Server error updating voucher" });
  }
});

// Delete a voucher
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    // Block deleting savings deposit vouchers
    if (voucher.category === "Savings Deposit") {
      return res.status(400).json({ message: "Member deposit vouchers cannot be deleted from here" });
    }

    await prisma.voucher.delete({
      where: { id },
    });

    res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    console.error("Voucher delete error:", error);
    res.status(500).json({ message: "Server error deleting voucher" });
  }
});

export default router;
