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
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const [totalMembers, activeMembers, totalSavings, totalLoanDisbursed, totalLoanPaid, activeLoanCount, todayDeposits, monthDeposits, recentIncome, recentExpense, monthlyIncome, monthlyExpense, totalIncomeVouchers, totalExpenseVouchers, memberDepositVouchers, monthExpenseVouchers,] = await Promise.all([
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
                    transactionDate: { gte: startOfToday, lte: endOfToday },
                },
            }),
            // চলতি মাসের সঞ্চয় জমা
            prisma.savingsTransaction.aggregate({
                _sum: { amount: true },
                where: {
                    type: "DEPOSIT",
                    transactionDate: { gte: startOfMonth, lte: endOfMonth },
                },
            }),
            // সাম্প্রতিক ৫টি ইনকাম ভাউচার
            prisma.voucher.findMany({
                take: 5,
                where: { type: "INCOME" },
                orderBy: { date: "desc" },
                include: {
                    member: { select: { name: true, memberId: true } },
                    savingsAccount: { select: { accountNo: true } }
                }
            }),
            // সাম্প্রতিক ৫টি ব্যয় ভাউচার
            prisma.voucher.findMany({
                take: 5,
                where: { type: "EXPENSE" },
                orderBy: { date: "desc" },
                include: {
                    member: { select: { name: true, memberId: true } },
                    savingsAccount: { select: { accountNo: true } }
                }
            }),
            // গত ৬ মাসের মাসিক আয় (চার্টের জন্য)
            prisma.$queryRaw `
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          SUM(amount) AS totalIncome
        FROM voucher
        WHERE type = 'INCOME'
          AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
      `,
            // গত ৬ মাসের মাসিক ব্যয় (চার্টের জন্য)
            prisma.$queryRaw `
        SELECT
          DATE_FORMAT(date, '%Y-%m') AS month,
          SUM(amount) AS totalExpense
        FROM voucher
        WHERE type = 'EXPENSE'
          AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
      `,
            // মোট আয়
            prisma.voucher.aggregate({
                _sum: { amount: true },
                where: { type: "INCOME" }
            }),
            // মোট ব্যয়
            prisma.voucher.aggregate({
                _sum: { amount: true },
                where: { type: "EXPENSE" }
            }),
            // মোট সদস্য আয় (সঞ্চয় জমা)
            prisma.voucher.aggregate({
                _sum: { amount: true },
                where: {
                    type: "INCOME",
                    category: "Savings Deposit"
                }
            }),
            // চলতি মাসের ব্যয়
            prisma.voucher.aggregate({
                _sum: { amount: true },
                where: {
                    type: "EXPENSE",
                    date: { gte: startOfMonth, lte: endOfMonth }
                }
            })
        ]);
        // মাসিক চার্ট ডেটা merge করা
        const monthNames = {
            "01": "জানু", "02": "ফেব্রু", "03": "মার্চ",
            "04": "এপ্রিল", "05": "মে", "06": "জুন",
            "07": "জুলাই", "08": "আগস্ট", "09": "সেপ্টে",
            "10": "অক্টো", "11": "নভে", "12": "ডিসে",
        };
        const incomeMap = new Map(monthlyIncome.map((r) => [r.month, Number(r.totalIncome)]));
        const expenseMap = new Map(monthlyExpense.map((r) => [r.month, Number(r.totalExpense)]));
        const allMonths = Array.from(new Set([...incomeMap.keys(), ...expenseMap.keys()])).sort();
        const chartData = allMonths.map((m) => ({
            name: monthNames[m.split("-")[1]] || m,
            income: incomeMap.get(m) || 0,
            expense: expenseMap.get(m) || 0,
        }));
        const totalIncomeVal = totalIncomeVouchers._sum.amount || 0;
        const totalExpenseVal = totalExpenseVouchers._sum.amount || 0;
        const totalMemberDepositVal = memberDepositVouchers._sum.amount || 0;
        const runningMonthExpenseVal = monthExpenseVouchers._sum.amount || 0;
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
                outstandingLoan: (totalLoanDisbursed._sum.amount || 0) -
                    (totalLoanPaid._sum.totalPaid || 0),
                netBalance: totalIncomeVal - totalExpenseVal,
                totalMemberDeposit: totalMemberDepositVal,
                othersIncome: totalIncomeVal - totalMemberDepositVal,
                totalExpenseAmount: totalExpenseVal,
                runningMonthExpense: runningMonthExpenseVal,
            },
            chartData,
            recentIncome,
            recentExpense,
        });
    }
    catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: "Server error fetching dashboard data" });
    }
});
export default router;
