import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Get all savings accounts with member details
router.get("/", async (req, res) => {
  try {
    const accounts = await prisma.savingsAccount.findMany({
      include: {
        member: { select: { name: true, memberId: true } },
      },
      orderBy: { openDate: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching savings accounts" });
  }
});

// Create new savings account
router.post("/", async (req, res) => {
  const { memberId, type, interestRate } = req.body;

  try {
    // Generate unique account number
    const count = await prisma.savingsAccount.count();
    const accountNo = `SAV-${String(count + 1).padStart(5, '0')}`;

    const account = await prisma.savingsAccount.create({
      data: {
        accountNo,
        memberId,
        type,
        interestRate: parseFloat(interestRate) || 0,
      },
      include: {
        member: { select: { name: true, memberId: true } }
      }
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: "Server error creating savings account" });
  }
});

// Deposit to savings account
router.post("/:id/deposit", async (req, res) => {
  const { id } = req.params;
  const { amount, reference } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const txRecord = await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          type: "DEPOSIT",
          amount: numAmount,
          reference,
        },
      });

      // Update account balance
      const account = await tx.savingsAccount.update({
        where: { id },
        data: {
          balance: { increment: numAmount },
        },
      });

      // Create an income voucher automatically
      const voucherCount = await tx.voucher.count();
      await tx.voucher.create({
        data: {
          voucherNo: `V-${String(voucherCount + 1).padStart(5, '0')}`,
          type: "INCOME",
          category: "Savings Deposit",
          amount: numAmount,
          description: `Deposit to savings account ${account.accountNo}`,
        }
      });

      return { txRecord, account };
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error during deposit" });
  }
});

export default router;
