import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// GET /api/member-portal/summary
router.get("/summary", async (req: any, res) => {
  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const phone = req.user.id;

  try {
    const members = await prisma.member.findMany({
      where: { phone },
    });

    if (members.length === 0) {
      return res.status(404).json({ message: "Member profiles not found" });
    }

    const memberIds = members.map(m => m.id);

    const savingsAccounts = await prisma.savingsAccount.findMany({
      where: { memberId: { in: memberIds } },
      include: {
        member: { select: { name: true, memberId: true } }
      }
    });

    const totalBalance = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      totalBalance,
      accountsCount: savingsAccounts.length,
      accounts: savingsAccounts,
      membersCount: members.length
    });
  } catch (error) {
    console.error("Member summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/member-portal/statement/:accountId
router.get("/statement/:accountId", async (req: any, res) => {
  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { accountId } = req.params;
  const phone = req.user.id;

  try {
    const account = await prisma.savingsAccount.findFirst({
      where: {
        id: accountId,
        member: { phone }
      },
      include: {
        member: { select: { id: true, name: true, memberId: true, phone: true } }
      }
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found or access denied" });
    }

    const transactions = await prisma.savingsTransaction.findMany({
      where: { savingsAccountId: accountId },
      orderBy: { transactionDate: "desc" }
    });

    res.json({
      account,
      transactions
    });
  } catch (error) {
    console.error("Member statement error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/member-portal/profile
router.get("/profile", async (req: any, res) => {
  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const phone = req.user.id;

  try {
    const members = await prisma.member.findMany({
      where: { phone },
      include: {
        savingsAccount: {
          select: { id: true, accountNo: true, type: true, balance: true }
        }
      }
    });
    res.json(members);
  } catch (error) {
    console.error("Member profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
