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

// GET /api/member-portal/feedback
router.get("/feedback", async (req: any, res) => {
  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const phone = req.user.id;

  try {
    const members = await prisma.member.findMany({
      where: { phone },
      select: { id: true }
    });

    const memberIds = members.map(m => m.id);

    const feedbacks = await prisma.feedback.findMany({
      where: { memberId: { in: memberIds } },
      orderBy: { createdAt: "desc" }
    });

    res.json(feedbacks);
  } catch (error) {
    console.error("Member feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/member-portal/feedback
router.post("/feedback", async (req: any, res) => {
  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const phone = req.user.id;
  const { type, subject, message } = req.body;

  try {
    // Find the first member associated with this phone
    const member = await prisma.member.findFirst({
      where: { phone },
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        memberId: member.id,
        type: type || "COMPLAINT",
        subject,
        message
      }
    });

    res.json(feedback);
  } catch (error) {
    console.error("Member create feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
