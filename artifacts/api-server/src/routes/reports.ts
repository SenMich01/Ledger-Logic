import { Router } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  GetProfitLossReportQueryParams,
  GetExpenseBreakdownQueryParams,
  GetRevenueBreakdownQueryParams,
} from "@workspace/api-zod";

const router = Router();

function groupByCategory(transactions: Array<{ category: string; amount: string }>, total: number) {
  const map = new Map<string, { amount: number; count: number }>();
  for (const tx of transactions) {
    const curr = map.get(tx.category) ?? { amount: 0, count: 0 };
    curr.amount += Number(tx.amount);
    curr.count += 1;
    map.set(tx.category, curr);
  }
  return Array.from(map.entries()).map(([category, { amount, count }]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
    count,
  })).sort((a, b) => b.amount - a.amount);
}

router.get("/profit-loss", async (req, res): Promise<void> => {
  const parsed = GetProfitLossReportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { startDate, endDate } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

  const income = transactions.filter(t => t.type === "income");
  const expenses = transactions.filter(t => t.type === "expense");
  const totalRevenue = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const grossProfit = totalRevenue - totalExpenses;

  res.json({
    totalRevenue,
    totalExpenses,
    grossProfit,
    profitMargin: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0,
    revenueByCategory: groupByCategory(income, totalRevenue),
    expenseByCategory: groupByCategory(expenses, totalExpenses),
    startDate,
    endDate,
  });
});

router.get("/expense-breakdown", async (req, res): Promise<void> => {
  const parsed = GetExpenseBreakdownQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { startDate, endDate } = parsed.data;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.type, "expense"),
      gte(transactionsTable.date, new Date(startDate)),
      lte(transactionsTable.date, new Date(endDate)),
    ));

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  res.json(groupByCategory(transactions, total));
});

router.get("/revenue-breakdown", async (req, res): Promise<void> => {
  const parsed = GetRevenueBreakdownQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { startDate, endDate } = parsed.data;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.type, "income"),
      gte(transactionsTable.date, new Date(startDate)),
      lte(transactionsTable.date, new Date(endDate)),
    ));

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  res.json(groupByCategory(transactions, total));
});

export default router;
