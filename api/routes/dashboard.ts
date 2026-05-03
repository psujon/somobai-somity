import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalMembers,
      activeMembers,
      totalSavings,
      totalLoanDisbursed,
      totalLoanPaid,
      activeLoanCount,
      todayDeposits,
      monthDeposits,
      recentTransactions,
      monthlySavings,
      monthlyLoans,
    ] = await Promise.all([
      // মোট সদস্য
      prisma.member.count(),

      // সক্রিয় সদস্য
      prisma.member.count({ where: { status: "ACTIVE" } }),

      // মোট সঞ্চয় (সকল হিসাবের ব্যালেন্সের যোগফল)
      prisma.savingsAccount.aggregate({ _sum: { balance: true } }),

      // মোট বিতরণকৃত ঋণ
      prisma.loan.aggregate({ _sum: { amount: true } }),

      // মোট পরিশোধিত ঋণ
      prisma.loan.aggregate({ _sum: { totalPaid: true } }),

      // সক্রিয় ঋণ সংখ্যা
      prisma.loan.count({ where: { status: "ACTIVE" } }),

      // আজকের সঞ্চয় জমা
      prisma.savingsTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "DEPOSIT",
          transactionDate: { gte: startOfToday },
        },
      }),

      // চলতি মাসের সঞ্চয় জমা
      prisma.savingsTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "DEPOSIT",
          transactionDate: { gte: startOfMonth },
        },
      }),

      // সাম্প্রতিক ১০টি ট্রানজেকশন
      prisma.savingsTransaction.findMany({
        take: 10,
        orderBy: { transactionDate: "desc" },
        include: {
          savingsAccount: {
            select: {
              accountNo: true,
              member: { select: { name: true, memberId: true } },
            },
          },
        },
      }),

      // গত ৬ মাসের মাসিক সঞ্চয় জমা (চার্টের জন্য)
      prisma.$queryRaw`
        SELECT
          DATE_FORMAT(transactionDate, '%Y-%m') AS month,
          SUM(amount) AS totalSavings
        FROM SavingsTransaction
        WHERE type = 'DEPOSIT'
          AND transactionDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
      `,

      // গত ৬ মাসের মাসিক ঋণ বিতরণ (চার্টের জন্য)
      prisma.$queryRaw`
        SELECT
          DATE_FORMAT(issueDate, '%Y-%m') AS month,
          SUM(amount) AS totalLoans
        FROM Loan
        WHERE issueDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
      `,
    ]);

    // মাসিক চার্ট ডেটা merge করা
    const monthNames: Record<string, string> = {
      "01": "জানু", "02": "ফেব্রু", "03": "মার্চ",
      "04": "এপ্রিল", "05": "মে", "06": "জুন",
      "07": "জুলাই", "08": "আগস্ট", "09": "সেপ্টে",
      "10": "অক্টো", "11": "নভে", "12": "ডিসে",
    };

    const savingsMap = new Map(
      (monthlySavings as any[]).map((r) => [r.month, Number(r.totalSavings)])
    );
    const loanMap = new Map(
      (monthlyLoans as any[]).map((r) => [r.month, Number(r.totalLoans)])
    );

    const allMonths = Array.from(
      new Set([...savingsMap.keys(), ...loanMap.keys()])
    ).sort();

    const chartData = allMonths.map((m) => ({
      name: monthNames[m.split("-")[1]] || m,
      savings: savingsMap.get(m) || 0,
      loan: loanMap.get(m) || 0,
    }));

    res.json({
      stats: {
        totalMembers,
        activeMembers,
        totalSavings: totalSavings._sum.balance || 0,
        totalLoanDisbursed: totalLoanDisbursed._sum.amount || 0,
        totalLoanPaid: totalLoanPaid._sum.totalPaid || 0,
        activeLoanCount,
        todayDeposits: todayDeposits._sum.amount || 0,
        monthDeposits: monthDeposits._sum.amount || 0,
        outstandingLoan:
          (totalLoanDisbursed._sum.amount || 0) -
          (totalLoanPaid._sum.totalPaid || 0),
      },
      chartData,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
});

export default router;
