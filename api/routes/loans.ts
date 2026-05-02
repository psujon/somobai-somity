import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// Get all loans
router.get("/", async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        member: { select: { name: true, memberId: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching loans" });
  }
});

// Apply for a loan
router.post("/", async (req, res) => {
  const { memberId, amount, interestRate } = req.body;
  const principal = parseFloat(amount);
  const rate = parseFloat(interestRate);

  if (!memberId || isNaN(principal) || isNaN(rate)) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const count = await prisma.loan.count();
    const loanNo = `LN-${String(count + 1).padStart(5, '0')}`;
    const totalPayable = principal + (principal * rate) / 100;

    const loan = await prisma.loan.create({
      data: {
        loanNo,
        memberId,
        amount: principal,
        interestRate: rate,
        totalPayable,
        status: "PENDING",
      },
      include: {
        member: { select: { name: true, memberId: true } }
      }
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: "Server error creating loan application" });
  }
});

// Approve & Disburse Loan
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({
        where: { id },
        data: {
          status: "ACTIVE",
          issueDate: new Date(),
        },
      });

      // Create an expense voucher for loan disbursement
      const voucherCount = await tx.voucher.count();
      await tx.voucher.create({
        data: {
          voucherNo: `V-${String(voucherCount + 1).padStart(5, '0')}`,
          type: "EXPENSE",
          category: "Loan Disbursement",
          amount: loan.amount,
          description: `Disbursed loan ${loan.loanNo}`,
        }
      });

      return loan;
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Error approving loan" });
  }
});

// Collect Installment
router.post("/:id/installment", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id } });
      if (!loan) throw new Error("Loan not found");

      const installment = await tx.loanInstallment.create({
        data: {
          loanId: id,
          amount: numAmount,
          status: "PAID",
        },
      });

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          totalPaid: { increment: numAmount },
          status: loan.totalPaid + numAmount >= loan.totalPayable ? "COMPLETED" : loan.status,
        },
      });

      // Income voucher for installment
      const voucherCount = await tx.voucher.count();
      await tx.voucher.create({
        data: {
          voucherNo: `V-${String(voucherCount + 1).padStart(5, '0')}`,
          type: "INCOME",
          category: "Loan Installment",
          amount: numAmount,
          description: `Collected installment for loan ${loan.loanNo}`,
        }
      });

      return { installment, updatedLoan };
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Error collecting installment" });
  }
});

export default router;
