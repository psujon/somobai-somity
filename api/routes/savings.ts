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
        member: { select: { id: true, name: true, memberId: true } },
      },
      orderBy: { openDate: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching savings accounts" });
  }
});

// Get all savings transactions (for Accounts/ledger page)
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await prisma.savingsTransaction.findMany({
      orderBy: { transactionDate: "desc" },
      include: {
        savingsAccount: {
          select: {
            accountNo: true,
            type: true,
            member: { select: { name: true, memberId: true } },
          },
        },
      },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching transactions" });
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
        member: { select: { id: true, name: true, memberId: true } }
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
  const { amount, transactionDate, depositMonth, voucherNo, remarks } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  // মাসের নাম → DB কলাম ম্যাপিং
  const monthColumns: Record<number, string> = {
    1: "jan", 2: "feb", 3: "mar", 4: "apr",
    5: "may", 6: "jun", 7: "jul", 8: "aug",
    9: "sep", 10: "oct", 11: "nov", 12: "dec",
  };

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // ১. ট্রানজেকশন রেকর্ড তৈরি
      const txRecord = await tx.savingsTransaction.create({
        data: {
          savingsAccountId: id,
          type: "DEPOSIT",
          amount: numAmount,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          depositMonth: depositMonth || null,
          voucherNo: voucherNo || null,
          remarks: remarks || null,
        },
      });

      // ২. হিসাবের ব্যালেন্স আপডেট এবং memberId বের করা
      const account = await tx.savingsAccount.update({
        where: { id },
        data: { balance: { increment: numAmount } },
        select: { accountNo: true, memberId: true },
      });

      // ৩. ইনকাম ভাউচার স্বয়ংক্রিয়ভাবে তৈরি
      const voucherCount = await tx.voucher.count();
      await tx.voucher.create({
        data: {
          voucherNo: voucherNo || `V-${String(voucherCount + 1).padStart(5, "0")}`,
          type: "INCOME",
          category: "Savings Deposit",
          amount: numAmount,
          memberId: account.memberId,
          savingsAccountId: id,
          depositMonth: depositMonth || null,
          description: remarks
            ? `Deposit to ${account.accountNo} | ${depositMonth || ""} | ${remarks}`
            : `Deposit to savings account ${account.accountNo}`,
          date: transactionDate ? new Date(transactionDate) : new Date(),
        },
      });

      // ৪. মাসওয়াইজ সারসংক্ষেপ আপডেট (depositMonth থেকে বছর ও মাস বের করা)
      if (depositMonth) {
        const [yearStr, monthStr] = depositMonth.split("-");
        const year = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        const colName = monthColumns[monthNum];

        if (colName && !isNaN(year)) {
          await (tx as any).monthlySavingsSummary.upsert({
            where: {
              memberId_year: { memberId: account.memberId, year },
            },
            update: {
              [colName]: { increment: numAmount },
            },
            create: {
              memberId: account.memberId,
              year,
              [colName]: numAmount,
            },
          });
        }
      }

      return { txRecord, account };
    });

    res.json(transaction);
  } catch (error: any) {
    console.error("Deposit error:", error);
    res.status(500).json({ message: error?.message || "Server error during deposit" });
  }
});

// GET /api/savings/monthly-summary/:memberId  — মাসওয়াইজ সারসংক্ষেপ
router.get("/monthly-summary/:memberId", async (req, res) => {
  const { memberId } = req.params;
  try {
    const summary = await (prisma as any).monthlySavingsSummary.findMany({
      where: { memberId },
      orderBy: { year: "desc" },
      include: {
        member: { select: { name: true, memberId: true } },
      },
    });
    res.json(summary);
  } catch (error) {
    console.error("Monthly summary error:", error);
    res.status(500).json({ message: "Error fetching monthly summary" });
  }
});

// GET /api/savings/statement/:memberId  — সদস্যের ব্যাংক স্টেটমেন্ট
router.get("/statement/:memberId", async (req, res) => {
  const { memberId } = req.params;
  const { from, to } = req.query; // optional date filters

  try {
    // সদস্যের সকল সঞ্চয় হিসাব খুঁজে নাও
    const accounts = await prisma.savingsAccount.findMany({
      where: { memberId },
      include: {
        member: { select: { id: true, name: true, memberId: true, phone: true, address: true } },
        transactions: {
          where: {
            ...(from || to
              ? {
                  transactionDate: {
                    ...(from ? { gte: new Date(from as string) } : {}),
                    ...(to ? { lte: new Date(new Date(to as string).setHours(23, 59, 59)) } : {}),
                  },
                }
              : {}),
          },
          orderBy: { transactionDate: "asc" },
        },
      },
    });

    if (accounts.length === 0) {
      return res.status(404).json({ message: "কোনো হিসাব পাওয়া যায়নি" });
    }

    // প্রতিটি হিসাবে রানিং ব্যালেন্স যোগ করো
    const statementAccounts = accounts.map((acc) => {
      let runningBalance = 0;
      const txWithBalance = acc.transactions.map((tx) => {
        if (tx.type === "DEPOSIT" || tx.type === "INTEREST") {
          runningBalance += tx.amount;
        } else if (tx.type === "WITHDRAWAL") {
          runningBalance -= tx.amount;
        }
        return { ...tx, runningBalance };
      });

      const totalDeposit = acc.transactions
        .filter((t) => t.type === "DEPOSIT")
        .reduce((s, t) => s + t.amount, 0);
      const totalWithdrawal = acc.transactions
        .filter((t) => t.type === "WITHDRAWAL")
        .reduce((s, t) => s + t.amount, 0);
      const totalInterest = acc.transactions
        .filter((t) => t.type === "INTEREST")
        .reduce((s, t) => s + t.amount, 0);

      return {
        ...acc,
        transactions: txWithBalance,
        summary: { totalDeposit, totalWithdrawal, totalInterest },
      };
    });

    res.json({ member: accounts[0].member, accounts: statementAccounts });
  } catch (error) {
    console.error("Statement error:", error);
    res.status(500).json({ message: "Statement fetch error" });
  }
});

// GET /api/savings/:id/last-transactions - মেম্বারের লাস্ট ৫ ট্রানজেকশন
router.get("/:id/last-transactions", async (req, res) => {
  const { id } = req.params;
  try {
    const txs = await prisma.savingsTransaction.findMany({
      where: { savingsAccountId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recent transactions" });
  }
});

// মাসের নাম → DB কলাম ম্যাপিং (Helper for Update/Delete)
const monthCols: Record<number, string> = {
  1: "jan", 2: "feb", 3: "mar", 4: "apr",
  5: "may", 6: "jun", 7: "jul", 8: "aug",
  9: "sep", 10: "oct", 11: "nov", 12: "dec",
};

// PUT /api/savings/transactions/:id - ট্রানজেকশন আপডেট
router.put("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const { amount, transactionDate, depositMonth, voucherNo, remarks } = req.body;
  const newAmount = parseFloat(amount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ১. পুরাতন ট্রানজেকশন ডাটা খুঁজে নাও
      const oldTx = await tx.savingsTransaction.findUnique({
        where: { id },
        include: { savingsAccount: true }
      });
      if (!oldTx) throw new Error("Transaction not found");

      const diff = newAmount - oldTx.amount;

      // ২. SavingsAccount ব্যালেন্স আপডেট
      await tx.savingsAccount.update({
        where: { id: oldTx.savingsAccountId },
        data: { balance: { increment: diff } }
      });

      // ৩. ভাউচার আপডেট (voucherNo দিয়ে খুঁজে)
      if (oldTx.voucherNo) {
        await tx.voucher.updateMany({
          where: { voucherNo: oldTx.voucherNo },
          data: {
            amount: newAmount,
            date: transactionDate ? new Date(transactionDate) : (oldTx.transactionDate || new Date()),
            description: remarks ?? undefined
          }
        });
      }

      // ৪. MonthlySavingsSummary আপডেট
      // পুরাতন মাস থেকে বিয়োগ
      if (oldTx.depositMonth) {
        const [oY, oM] = oldTx.depositMonth.split("-").map(Number);
        const oCol = monthCols[oM];
        if (oCol) {
          await (tx as any).monthlySavingsSummary.update({
            where: { memberId_year: { memberId: oldTx.savingsAccount.memberId, year: oY } },
            data: { [oCol]: { decrement: oldTx.amount } }
          });
        }
      }
      // নতুন মাসে যোগ
      if (depositMonth) {
        const [nY, nM] = depositMonth.split("-").map(Number);
        const nCol = monthCols[nM];
        if (nCol) {
          await (tx as any).monthlySavingsSummary.upsert({
            where: { memberId_year: { memberId: oldTx.savingsAccount.memberId, year: nY } },
            update: { [nCol]: { increment: newAmount } },
            create: { memberId: oldTx.savingsAccount.memberId, year: nY, [nCol]: newAmount }
          });
        }
      }

      // ৫. মেইন ট্রানজেকশন আপডেট
      const updatedTx = await tx.savingsTransaction.update({
        where: { id },
        data: {
          amount: newAmount,
          transactionDate: transactionDate ? new Date(transactionDate) : undefined,
          depositMonth,
          voucherNo,
          remarks
        }
      });

      return updatedTx;
    });

    res.json(result);
  } catch (error: any) {
    console.error("Update error:", error);
    res.status(500).json({ message: error?.message || "Error updating transaction" });
  }
});

// DELETE /api/savings/transactions/:id - ট্রানজেকশন ডিলেট
router.delete("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      const oldTx = await tx.savingsTransaction.findUnique({
        where: { id },
        include: { savingsAccount: true }
      });
      if (!oldTx) throw new Error("Transaction not found");

      // ১. ব্যালেন্স কমাও
      await tx.savingsAccount.update({
        where: { id: oldTx.savingsAccountId },
        data: { balance: { decrement: oldTx.amount } }
      });

      // ২. ভাউচার ডিলেট
      if (oldTx.voucherNo) {
        await tx.voucher.deleteMany({ where: { voucherNo: oldTx.voucherNo } });
      }

      // ৩. মান্থলি সামারি কমাও
      if (oldTx.depositMonth) {
        const [y, m] = oldTx.depositMonth.split("-").map(Number);
        const col = monthCols[m];
        if (col) {
          await (tx as any).monthlySavingsSummary.update({
            where: { memberId_year: { memberId: oldTx.savingsAccount.memberId, year: y } },
            data: { [col]: { decrement: oldTx.amount } }
          });
        }
      }

      // ৪. ট্রানজেকশন ডিলেট
      await tx.savingsTransaction.delete({ where: { id } });
    });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Error deleting transaction" });
  }
});

export default router;
