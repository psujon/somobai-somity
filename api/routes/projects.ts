import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// GET /api/projects - সকল প্রজেক্টের তালিকা ও আর্থিক সামারি
router.get("/", async (req, res) => {
  try {
    const { status, search, from, to } = req.query;

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status as string;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
        { location: { contains: search as string } },
      ];
    }

    const voucherWhere: any = {};
    if (from || to) {
      voucherWhere.date = {};
      if (from) voucherWhere.date.gte = new Date(from as string);
      if (to) {
        const toD = new Date(to as string);
        toD.setHours(23, 59, 59, 999);
        voucherWhere.date.lte = toD;
      }
    }

    const projects = await (prisma as any).project.findMany({
      where: whereClause,
      include: {
        vouchers: {
          where: Object.keys(voucherWhere).length > 0 ? voucherWhere : undefined,
          select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            date: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let overallInvestment = 0;
    let overallIncome = 0;
    let overallExpense = 0;

    const formattedProjects = projects.map((p: any) => {
      let totalInvestment = 0;
      let totalIncome = 0;
      let totalExpense = 0;

      for (const v of p.vouchers) {
        if (v.type === "INVESTMENT") {
          totalInvestment += v.amount;
        } else if (v.type === "INCOME") {
          totalIncome += v.amount;
        } else if (v.type === "EXPENSE") {
          totalExpense += v.amount;
        }
      }

      overallInvestment += totalInvestment;
      overallIncome += totalIncome;
      overallExpense += totalExpense;

      // Net Balance = আয় - (ব্যয় + বিনিয়োগ)
      const netBalance = totalIncome - (totalExpense + totalInvestment);
      const budget = p.budget || 0;
      const budgetUtilization = budget > 0 ? ((totalInvestment + totalExpense) / budget) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        location: p.location,
        budget: p.budget,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        voucherCount: p.vouchers.length,
        totalInvestment,
        totalIncome,
        totalExpense,
        netBalance,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      };
    });

    const overallNet = overallIncome - (overallExpense + overallInvestment);

    res.json({
      from: from || null,
      to: to || null,
      summary: {
        totalProjects: formattedProjects.length,
        overallInvestment,
        overallIncome,
        overallExpense,
        overallNet,
      },
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "প্রজেক্ট তালিকা লোড করতে সমস্যা হয়েছে" });
  }
});

// GET /api/projects/:id - একক প্রজেক্টের পূর্ণাঙ্গ বিবরণী ও ভাউচার তালিকা
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;
  try {
    const voucherWhere: any = {};
    if (from || to) {
      voucherWhere.date = {};
      if (from) voucherWhere.date.gte = new Date(from as string);
      if (to) {
        const toD = new Date(to as string);
        toD.setHours(23, 59, 59, 999);
        voucherWhere.date.lte = toD;
      }
    }

    const project = await (prisma as any).project.findUnique({
      where: { id },
      include: {
        vouchers: {
          where: Object.keys(voucherWhere).length > 0 ? voucherWhere : undefined,
          include: {
            member: { select: { id: true, name: true, memberId: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "প্রজেক্ট পাওয়া যায়নি" });
    }

    let totalInvestment = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    const investmentCategories: Record<string, { amount: number; count: number }> = {};
    const incomeCategories: Record<string, { amount: number; count: number }> = {};
    const expenseCategories: Record<string, { amount: number; count: number }> = {};

    for (const v of project.vouchers) {
      if (v.type === "INVESTMENT") {
        totalInvestment += v.amount;
        if (!investmentCategories[v.category]) investmentCategories[v.category] = { amount: 0, count: 0 };
        investmentCategories[v.category].amount += v.amount;
        investmentCategories[v.category].count += 1;
      } else if (v.type === "INCOME") {
        totalIncome += v.amount;
        if (!incomeCategories[v.category]) incomeCategories[v.category] = { amount: 0, count: 0 };
        incomeCategories[v.category].amount += v.amount;
        incomeCategories[v.category].count += 1;
      } else if (v.type === "EXPENSE") {
        totalExpense += v.amount;
        if (!expenseCategories[v.category]) expenseCategories[v.category] = { amount: 0, count: 0 };
        expenseCategories[v.category].amount += v.amount;
        expenseCategories[v.category].count += 1;
      }
    }

    const netBalance = totalIncome - (totalExpense + totalInvestment);
    const budget = project.budget || 0;
    const budgetUtilization = budget > 0 ? ((totalInvestment + totalExpense) / budget) * 100 : 0;

    res.json({
      from: from || null,
      to: to || null,
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        location: project.location,
        budget: project.budget,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      metrics: {
        totalInvestment,
        totalIncome,
        totalExpense,
        netBalance,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        voucherCount: project.vouchers.length,
      },
      categoryBreakdown: {
        investment: Object.entries(investmentCategories).map(([cat, data]) => ({ category: cat, ...data })),
        income: Object.entries(incomeCategories).map(([cat, data]) => ({ category: cat, ...data })),
        expense: Object.entries(expenseCategories).map(([cat, data]) => ({ category: cat, ...data })),
      },
      vouchers: project.vouchers,
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ message: "প্রজেক্টের বিবরণ লোড করতে সমস্যা হয়েছে" });
  }
});

// POST /api/projects - নতুন প্রজেক্ট তৈরি
router.post("/", async (req, res) => {
  const { name, code, location, budget, status, startDate, endDate, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "প্রজেক্টের নাম আবশ্যক" });
  }

  try {
    // ডুপ্লিকেট নাম যাচাই
    const existingName = await (prisma as any).project.findUnique({
      where: { name: name.trim() },
    });
    if (existingName) {
      return res.status(400).json({ message: "এই নামে ইতিমধ্যে একটি প্রজেক্ট আছে" });
    }

    if (code && code.trim()) {
      const existingCode = await (prisma as any).project.findUnique({
        where: { code: code.trim() },
      });
      if (existingCode) {
        return res.status(400).json({ message: "এই কোডে ইতিমধ্যে একটি প্রজেক্ট আছে" });
      }
    }

    const project = await (prisma as any).project.create({
      data: {
        name: name.trim(),
        code: code && code.trim() ? code.trim() : null,
        location: location || null,
        budget: budget ? parseFloat(budget) : 0,
        status: status || "ONGOING",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error("Error creating project:", error);
    if (error.message?.includes("Duplicate entry")) {
      return res.status(400).json({ message: "প্রজেক্টের নাম বা কোড ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
    res.status(500).json({ message: "প্রজেক্ট তৈরি করতে সমস্যা হয়েছে" });
  }
});

// PUT /api/projects/:id - প্রজেক্ট আপডেট
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, code, location, budget, status, startDate, endDate, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "প্রজেক্টের নাম আবশ্যক" });
  }

  try {
    const existing = await (prisma as any).project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "প্রজেক্ট পাওয়া যায়নি" });
    }

    // নাম পরিবর্তিত হলে ডুপ্লিকেট চেক
    if (existing.name !== name.trim()) {
      const duplicateName = await (prisma as any).project.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (duplicateName) {
        return res.status(400).json({ message: "এই নামে ইতিমধ্যে একটি প্রজেক্ট আছে" });
      }
    }

    // কোড পরিবর্তিত হলে ডুপ্লিকেট চেক
    if (code && code.trim() && existing.code !== code.trim()) {
      const duplicateCode = await (prisma as any).project.findFirst({
        where: { code: code.trim(), id: { not: id } },
      });
      if (duplicateCode) {
        return res.status(400).json({ message: "এই কোডে ইতিমধ্যে একটি প্রজেক্ট আছে" });
      }
    }

    const updated = await (prisma as any).project.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code && code.trim() ? code.trim() : null,
        location: location || null,
        budget: budget ? parseFloat(budget) : 0,
        status: status || existing.status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating project:", error);
    if (error.message?.includes("Duplicate entry")) {
      return res.status(400).json({ message: "প্রজেক্টের নাম বা কোড ইতিমধ্যে ব্যবহৃত হয়েছে" });
    }
    res.status(500).json({ message: "প্রজেক্ট আপডেট করতে সমস্যা হয়েছে" });
  }
});

// DELETE /api/projects/:id - নিরাপদ প্রজেক্ট ডিলিট
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await (prisma as any).project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "প্রজেক্ট পাওয়া যায়নি" });
    }

    // চেক করা এই প্রজেক্টের অধীনে ভাউচার আছে কিনা
    const voucherCount = await prisma.voucher.count({
      where: { projectId: id } as any,
    });

    if (voucherCount > 0) {
      return res.status(400).json({
        message: `"${existing.name}" প্রজেক্টের সাথে ${voucherCount} টি ভাউচার যুক্ত আছে। হিসাব সুরক্ষিত রাখতে এটি ডিলিট করা যাবে না। আপনি চাইলে স্ট্যাটাস 'সমাপ্ত' (COMPLETED) বা 'স্থগিত' (PAUSED) করতে পারেন।`,
      });
    }

    await (prisma as any).project.delete({ where: { id } });
    res.json({ message: "প্রজেক্ট সফলভাবে ডিলিট হয়েছে" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "প্রজেক্ট ডিলিট করতে সমস্যা হয়েছে" });
  }
});

export default router;
