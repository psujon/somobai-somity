import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendSms } from "../utils/sms.js";
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error creating savings account" });
    }
});
async function getNextVoucherRef(tx) {
    const lastVouchers = await tx.voucher.findMany({
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
// Deposit to savings account
router.post("/:id/deposit", async (req, res) => {
    const { id } = req.params;
    const { amount, transactionDate, depositMonth, voucherNo, remarks } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }
    // Check if deposit already exists for the given month
    if (depositMonth) {
        try {
            const existingDeposit = await prisma.savingsTransaction.findFirst({
                where: {
                    savingsAccountId: id,
                    type: "DEPOSIT",
                    depositMonth: depositMonth,
                },
            });
            if (existingDeposit) {
                return res.status(400).json({ message: "ঐ মাসে ইতিমধ্যে সঞ্চয় জমা হয়েছে।" });
            }
        }
        catch (err) {
            console.error("Error checking existing deposit:", err);
            return res.status(500).json({ message: "সার্ভার এরর" });
        }
    }
    // মাসের নাম → DB কলাম ম্যাপিং
    const monthColumns = {
        1: "jan", 2: "feb", 3: "mar", 4: "apr",
        5: "may", 6: "jun", 7: "jul", 8: "aug",
        9: "sep", 10: "oct", 11: "nov", 12: "dec",
    };
    try {
        const transaction = await prisma.$transaction(async (tx) => {
            const voucherRef = await getNextVoucherRef(tx);
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
                    voucherRef,
                },
            });
            // ২. হিসাবের ব্যালেন্স আপডেট এবং memberId বের করা
            const account = await tx.savingsAccount.update({
                where: { id },
                data: { balance: { increment: numAmount } },
                select: {
                    accountNo: true,
                    memberId: true,
                    member: {
                        select: {
                            name: true,
                            phone: true,
                            memberId: true
                        }
                    }
                },
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
                    voucherRef,
                },
            });
            // ৪. মাসওয়াইজ সারসংক্ষেপ আপডেট (depositMonth থেকে বছর ও মাস বের করা)
            if (depositMonth) {
                const [yearStr, monthStr] = depositMonth.split("-");
                const year = parseInt(yearStr);
                const monthNum = parseInt(monthStr);
                const colName = monthColumns[monthNum];
                if (colName && !isNaN(year)) {
                    await tx.monthlySavingsSummary.upsert({
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
        // SMS পাঠানোর চেষ্টা করা হচ্ছে (অ্যাসিনক্রোনাসলি)
        const phone = transaction.account.member?.phone;
        if (phone) {
            sendDepositSms(phone, transaction.account.member.name, numAmount, transaction.account.member.memberId, depositMonth, transactionDate, voucherNo)
                .catch(err => console.error("SMS notification send failed:", err));
        }
    }
    catch (error) {
        console.error("Deposit error:", error);
        res.status(500).json({ message: error?.message || "Server error during deposit" });
    }
});
// GET /api/savings/monthly-summary/:memberId  — মাসওয়াইজ সারসংক্ষেপ
router.get("/monthly-summary/:memberId", async (req, res) => {
    const { memberId } = req.params;
    try {
        const summary = await prisma.monthlySavingsSummary.findMany({
            where: { memberId },
            orderBy: { year: "desc" },
            include: {
                member: { select: { name: true, memberId: true } },
            },
        });
        res.json(summary);
    }
    catch (error) {
        console.error("Monthly summary error:", error);
        res.status(500).json({ message: "Error fetching monthly summary" });
    }
});
// GET /api/savings/reports/association-income-expense — সমিতি আয়-ব্যয় বিবরণী
router.get("/reports/association-income-expense", async (req, res) => {
    const { from, to } = req.query;
    try {
        const vouchers = await prisma.voucher.findMany({
            where: {
                ...(from || to
                    ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59)) } : {}),
                        },
                    }
                    : {}),
            },
            select: {
                type: true,
                category: true,
                amount: true,
            },
        });
        const incomeMap = {};
        const expenseMap = {};
        const investmentMap = {};
        let totalIncome = 0;
        let totalExpense = 0;
        for (const v of vouchers) {
            if (v.type === "INCOME") {
                incomeMap[v.category] = (incomeMap[v.category] || 0) + v.amount;
                totalIncome += v.amount;
            }
            else if (v.type === "EXPENSE") {
                expenseMap[v.category] = (expenseMap[v.category] || 0) + v.amount;
                totalExpense += v.amount;
            }
            else if (v.type === "INVESTMENT") {
                investmentMap[v.category] = (investmentMap[v.category] || 0) + v.amount;
                totalExpense += v.amount;
            }
        }
        const incomes = Object.entries(incomeMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        const expenses = Object.entries(expenseMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        const investments = Object.entries(investmentMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        res.json({
            incomes,
            expenses,
            investments,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
        });
    }
    catch (error) {
        console.error("Association income-expense error:", error);
        res.status(500).json({ message: "Error fetching income-expense report" });
    }
});
// GET /api/savings/reports/monthly-association-income-expense — মাসিক সমিতি আয়-ব্যয় বিবরণী
router.get("/reports/monthly-association-income-expense", async (req, res) => {
    try {
        let targetMonth = req.query.month || "";
        if (!targetMonth) {
            const now = new Date();
            targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        }
        const [yStr, mStr] = targetMonth.split("-");
        const y = parseInt(yStr);
        const m = parseInt(mStr);
        const startDate = new Date(y, m - 1, 1, 0, 0, 0, 0);
        const lastDay = new Date(y, m, 0).getDate();
        const endDate = new Date(y, m - 1, lastDay, 23, 59, 59, 999);
        // ১. বিগত মাসসমূহের মোট আয় ও মোট ব্যয় (যাহা startDate এর পূর্বে সংঘটিত)
        const previousVouchers = await prisma.voucher.findMany({
            where: {
                date: {
                    lt: startDate,
                },
            },
            select: {
                type: true,
                amount: true,
            },
        });
        let previousTotalIncome = 0;
        let previousTotalExpense = 0;
        for (const v of previousVouchers) {
            if (v.type === "INCOME") {
                previousTotalIncome += v.amount;
            }
            else if (v.type === "EXPENSE" || v.type === "INVESTMENT") {
                previousTotalExpense += v.amount;
            }
        }
        const previousNetBalance = previousTotalIncome - previousTotalExpense;
        // ২. নির্বাচিত চলতি মাসের আয় ও ব্যয়
        const currentVouchers = await prisma.voucher.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                voucherNo: true,
                type: true,
                category: true,
                amount: true,
                description: true,
                date: true,
            },
            orderBy: { date: "asc" },
        });
        const incomeMap = {};
        const expenseMap = {};
        const investmentMap = {};
        let currentMonthIncome = 0;
        let currentMonthExpense = 0;
        for (const v of currentVouchers) {
            if (v.type === "INCOME") {
                incomeMap[v.category] = (incomeMap[v.category] || 0) + v.amount;
                currentMonthIncome += v.amount;
            }
            else if (v.type === "EXPENSE") {
                expenseMap[v.category] = (expenseMap[v.category] || 0) + v.amount;
                currentMonthExpense += v.amount;
            }
            else if (v.type === "INVESTMENT") {
                investmentMap[v.category] = (investmentMap[v.category] || 0) + v.amount;
                currentMonthExpense += v.amount;
            }
        }
        const incomes = Object.entries(incomeMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        const expenses = Object.entries(expenseMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        const investments = Object.entries(investmentMap).map(([category, amount]) => ({
            category,
            amount,
        }));
        const currentMonthNetBalance = currentMonthIncome - currentMonthExpense;
        const totalIncome = previousTotalIncome + currentMonthIncome;
        const totalExpense = previousTotalExpense + currentMonthExpense;
        const finalBalance = totalIncome - totalExpense;
        res.json({
            month: targetMonth,
            startDate,
            endDate,
            incomes,
            expenses,
            investments,
            summary: {
                previousTotalIncome,
                previousTotalExpense,
                previousNetBalance,
                currentMonthIncome,
                currentMonthExpense,
                currentMonthNetBalance,
                totalIncome,
                totalExpense,
                finalBalance,
            },
        });
    }
    catch (error) {
        console.error("Monthly association income-expense error:", error);
        res.status(500).json({ message: "Error fetching monthly income-expense report" });
    }
});
// GET /api/savings/reports/income-statement — আয়ের বিবরণী
router.get("/reports/income-statement", async (req, res) => {
    const { from, to, category } = req.query;
    try {
        const whereClause = {
            type: "INCOME",
            ...(from || to
                ? {
                    date: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59)) } : {}),
                    },
                }
                : {}),
        };
        if (category && category !== "ALL") {
            whereClause.category = category;
        }
        const vouchers = await prisma.voucher.findMany({
            where: whereClause,
            include: {
                member: { select: { name: true, memberId: true } },
            },
            orderBy: { date: "asc" },
        });
        const categoryMap = {};
        let totalIncome = 0;
        for (const v of vouchers) {
            if (!categoryMap[v.category]) {
                categoryMap[v.category] = { amount: 0, count: 0 };
            }
            categoryMap[v.category].amount += v.amount;
            categoryMap[v.category].count += 1;
            totalIncome += v.amount;
        }
        const categorySummary = Object.entries(categoryMap).map(([cat, data]) => ({
            category: cat,
            amount: data.amount,
            count: data.count,
        }));
        res.json({
            from: from || null,
            to: to || null,
            totalIncome,
            totalCount: vouchers.length,
            categorySummary,
            vouchers,
        });
    }
    catch (error) {
        console.error("Income statement error:", error);
        res.status(500).json({ message: "Error fetching income statement" });
    }
});
// GET /api/savings/reports/expense-statement — ব্যয়ের বিবরণী
router.get("/reports/expense-statement", async (req, res) => {
    const { from, to, category, type } = req.query;
    try {
        const typeFilter = type && type !== "ALL"
            ? type
            : { in: ["EXPENSE", "INVESTMENT"] };
        const whereClause = {
            type: typeFilter,
            ...(from || to
                ? {
                    date: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59)) } : {}),
                    },
                }
                : {}),
        };
        if (category && category !== "ALL") {
            whereClause.category = category;
        }
        const vouchers = await prisma.voucher.findMany({
            where: whereClause,
            include: {
                member: { select: { name: true, memberId: true } },
            },
            orderBy: { date: "asc" },
        });
        const expenseCategoryMap = {};
        const investmentCategoryMap = {};
        let totalExpense = 0;
        let totalInvestment = 0;
        for (const v of vouchers) {
            if (v.type === "EXPENSE") {
                if (!expenseCategoryMap[v.category]) {
                    expenseCategoryMap[v.category] = { amount: 0, count: 0 };
                }
                expenseCategoryMap[v.category].amount += v.amount;
                expenseCategoryMap[v.category].count += 1;
                totalExpense += v.amount;
            }
            else if (v.type === "INVESTMENT") {
                if (!investmentCategoryMap[v.category]) {
                    investmentCategoryMap[v.category] = { amount: 0, count: 0 };
                }
                investmentCategoryMap[v.category].amount += v.amount;
                investmentCategoryMap[v.category].count += 1;
                totalInvestment += v.amount;
            }
        }
        const expenseCategories = Object.entries(expenseCategoryMap).map(([cat, data]) => ({
            category: cat,
            amount: data.amount,
            count: data.count,
        }));
        const investmentCategories = Object.entries(investmentCategoryMap).map(([cat, data]) => ({
            category: cat,
            amount: data.amount,
            count: data.count,
        }));
        const grandTotalExpense = totalExpense + totalInvestment;
        res.json({
            from: from || null,
            to: to || null,
            totalExpense,
            totalInvestment,
            grandTotalExpense,
            totalCount: vouchers.length,
            expenseCategories,
            investmentCategories,
            vouchers,
        });
    }
    catch (error) {
        console.error("Expense statement error:", error);
        res.status(500).json({ message: "Error fetching expense statement" });
    }
});
// GET /api/savings/reports/investment-statement — বিনিয়োগ বিবরণী
router.get("/reports/investment-statement", async (req, res) => {
    const { from, to, category } = req.query;
    try {
        const whereClause = {
            type: "INVESTMENT",
            ...(from || to
                ? {
                    date: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59)) } : {}),
                    },
                }
                : {}),
        };
        if (category && category !== "ALL") {
            whereClause.category = category;
        }
        const vouchers = await prisma.voucher.findMany({
            where: whereClause,
            include: {
                member: { select: { name: true, memberId: true } },
            },
            orderBy: { date: "asc" },
        });
        const categoryMap = {};
        let totalInvestment = 0;
        for (const v of vouchers) {
            if (!categoryMap[v.category]) {
                categoryMap[v.category] = { amount: 0, count: 0 };
            }
            categoryMap[v.category].amount += v.amount;
            categoryMap[v.category].count += 1;
            totalInvestment += v.amount;
        }
        const categorySummary = Object.entries(categoryMap).map(([cat, data]) => ({
            category: cat,
            amount: data.amount,
            count: data.count,
        }));
        res.json({
            from: from || null,
            to: to || null,
            totalInvestment,
            totalCount: vouchers.length,
            categorySummary,
            vouchers,
        });
    }
    catch (error) {
        console.error("Investment statement error:", error);
        res.status(500).json({ message: "Error fetching investment statement" });
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
                                    ...(from ? { gte: new Date(from) } : {}),
                                    ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59)) } : {}),
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
                }
                else if (tx.type === "WITHDRAWAL") {
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
    }
    catch (error) {
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
            orderBy: { createdAt: "desc" }
        });
        res.json(txs);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching recent transactions" });
    }
});
// মাসের নাম → DB কলাম ম্যাপিং (Helper for Update/Delete)
const monthCols = {
    1: "jan", 2: "feb", 3: "mar", 4: "apr",
    5: "may", 6: "jun", 7: "jul", 8: "aug",
    9: "sep", 10: "oct", 11: "nov", 12: "dec",
};
// PUT /api/savings/transactions/:id - ট্রানজেকশন আপডেট
router.put("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { amount, transactionDate, depositMonth, voucherNo, remarks } = req.body;
    const newAmount = parseFloat(amount);
    let memberInfo = null;
    let txType = "DEPOSIT";
    try {
        const result = await prisma.$transaction(async (tx) => {
            // ১. পুরাতন ট্রানজেকশন ডাটা খুঁজে নাও
            const oldTx = await tx.savingsTransaction.findUnique({
                where: { id },
                include: {
                    savingsAccount: {
                        include: {
                            member: true
                        }
                    }
                }
            });
            if (!oldTx)
                throw new Error("Transaction not found");
            memberInfo = oldTx.savingsAccount.member;
            txType = oldTx.type;
            const diff = newAmount - oldTx.amount;
            // ২. SavingsAccount ব্যালেন্স আপডেট
            await tx.savingsAccount.update({
                where: { id: oldTx.savingsAccountId },
                data: { balance: { increment: diff } }
            });
            // ৩. ভাউচার আপডেট (voucherRef বা voucherNo দিয়ে খুঁজে)
            if (oldTx.voucherRef) {
                await tx.voucher.updateMany({
                    where: { voucherRef: oldTx.voucherRef },
                    data: {
                        amount: newAmount,
                        date: transactionDate ? new Date(transactionDate) : (oldTx.transactionDate || new Date()),
                        description: remarks ?? undefined
                    }
                });
            }
            else if (oldTx.voucherNo) {
                // Fallback for old transactions to minimize collateral damage
                await tx.voucher.updateMany({
                    where: {
                        voucherNo: oldTx.voucherNo,
                        savingsAccountId: oldTx.savingsAccountId,
                        amount: oldTx.amount
                    },
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
                    await tx.monthlySavingsSummary.update({
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
                    await tx.monthlySavingsSummary.upsert({
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
        // Send SMS notification if transaction type is DEPOSIT and phone is available
        if (memberInfo && memberInfo.phone && txType === "DEPOSIT") {
            sendUpdateDepositSms(memberInfo.phone, memberInfo.name, newAmount, memberInfo.memberId, depositMonth, transactionDate, voucherNo).catch((err) => console.error("SMS update notification send failed:", err));
        }
    }
    catch (error) {
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
            if (!oldTx)
                throw new Error("Transaction not found");
            // ১. ব্যালেন্স কমাও
            await tx.savingsAccount.update({
                where: { id: oldTx.savingsAccountId },
                data: { balance: { decrement: oldTx.amount } }
            });
            // ২. ভাউচার ডিলেট (voucherRef বা voucherNo দিয়ে খুঁজে)
            if (oldTx.voucherRef) {
                await tx.voucher.deleteMany({ where: { voucherRef: oldTx.voucherRef } });
            }
            else if (oldTx.voucherNo) {
                // Fallback for old transactions
                await tx.voucher.deleteMany({
                    where: {
                        voucherNo: oldTx.voucherNo,
                        savingsAccountId: oldTx.savingsAccountId,
                        amount: oldTx.amount
                    }
                });
            }
            // ৩. মান্থলি সামারি কমাও
            if (oldTx.depositMonth) {
                const [y, m] = oldTx.depositMonth.split("-").map(Number);
                const col = monthCols[m];
                if (col) {
                    await tx.monthlySavingsSummary.update({
                        where: { memberId_year: { memberId: oldTx.savingsAccount.memberId, year: y } },
                        data: { [col]: { decrement: oldTx.amount } }
                    });
                }
            }
            // ৪. ট্রানজেকশন ডিলেট
            await tx.savingsTransaction.delete({ where: { id } });
        });
        res.json({ message: "Transaction deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Error deleting transaction" });
    }
});
async function sendDepositSms(phone, memberName, amount, accountNo, depositMonth, transactionDate, depositVoucherNo, retryCount = 3) {
    // Format depositMonth to ShortMonth-Year if present
    let prefixText = "";
    if (depositMonth) {
        const [year, month] = depositMonth.split("-");
        const monthNamesEn = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            prefixText = `${monthNamesEn[monthIndex]}-${year} `;
        }
    }
    let formattedDate = "";
    if (transactionDate) {
        const d = new Date(transactionDate);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
        }
    }
    if (!formattedDate) {
        formattedDate = new Date().toISOString().split("T")[0];
    }
    // Bengali/English SMS text
    const message = `Dear Shareholders (${accountNo}), your ${prefixText} monthly installment of BDT ${amount}.00 has been received successfully on ${formattedDate}. Receipt No: ${depositVoucherNo}. Thank you for being with Future Value Properties.`;
    return sendSms(phone, message, retryCount);
}
async function sendUpdateDepositSms(phone, memberName, amount, accountNo, depositMonth, transactionDate, depositVoucherNo, retryCount = 3) {
    // Format depositMonth to ShortMonth-Year if present
    let prefixText = "";
    if (depositMonth) {
        const [year, month] = depositMonth.split("-");
        const monthNamesEn = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            prefixText = `${monthNamesEn[monthIndex]}-${year} `;
        }
    }
    let formattedDate = "";
    if (transactionDate) {
        const d = new Date(transactionDate);
        if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
        }
    }
    if (!formattedDate) {
        formattedDate = new Date().toISOString().split("T")[0];
    }
    // Bengali/English SMS text
    const message = `Dear Shareholders (${accountNo}), your ${prefixText} monthly installment of BDT ${amount}.00 has been updated successfully on ${formattedDate}. Receipt No: ${depositVoucherNo}. Thank you for being with Future Value Properties.`;
    return sendSms(phone, message, retryCount);
}
export default router;
