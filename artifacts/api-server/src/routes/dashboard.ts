import { Router } from "express";
import { db, transactionsTable, invoicesTable, debtsTable, customersTable } from "@workspace/db";
import { eq, gte, lte, ne, and, sql, desc } from "drizzle-orm";
import {
  GetDashboardSummaryQueryParams,
  GetCashFlowQueryParams,
  GetDashboardRecentTransactionsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

router.get("/summary", async (req, res): Promise<void> => {
  const parsed = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const period = parsed.data.period ?? "month";
  const { start, end } = getPeriodRange(period);

  const [transactions, pendingInvoices, debtsData] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(and(gte(transactionsTable.date, start), lte(transactionsTable.date, end))),
    db.select({ count: sql<number>`count(*)` }).from(invoicesTable).where(eq(invoicesTable.status, "pending")),
    db.select().from(debtsTable).where(ne(debtsTable.status, "paid")),
  ]);

  const totalRevenue = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const outstandingDebts = debtsData.reduce((s, d) => s + (Number(d.amount) - Number(d.amountPaid)), 0);

  res.json({
    totalRevenue,
    totalExpenses,
    profit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    outstandingDebts,
    pendingInvoices: Number(pendingInvoices[0].count),
    recentTransactionCount: transactions.length,
    period,
  });
});

router.get("/cash-flow", async (req, res): Promise<void> => {
  const parsed = GetCashFlowQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const period = parsed.data.period ?? "month";

  let days = 30;
  if (period === "week") days = 7;
  if (period === "year") days = 365;

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(gte(transactionsTable.date, start));

  const dateMap = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dateMap.set(key, { income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const key = new Date(tx.date).toISOString().split("T")[0];
    const entry = dateMap.get(key);
    if (entry) {
      if (tx.type === "income") entry.income += Number(tx.amount);
      else entry.expense += Number(tx.amount);
    }
  }

  const data = Array.from(dateMap.entries()).map(([date, { income, expense }]) => ({
    date,
    income,
    expense,
    net: income - expense,
  }));

  res.json({ data, period });
});

router.get("/recent-transactions", async (req, res): Promise<void> => {
  const parsed = GetDashboardRecentTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 5;

  const rows = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      category: transactionsTable.category,
      description: transactionsTable.description,
      paymentMethod: transactionsTable.paymentMethod,
      date: transactionsTable.date,
      customerId: transactionsTable.customerId,
      customerName: customersTable.name,
      createdAt: transactionsTable.createdAt,
      updatedAt: transactionsTable.updatedAt,
    })
    .from(transactionsTable)
    .leftJoin(customersTable, eq(transactionsTable.customerId, customersTable.id))
    .orderBy(desc(transactionsTable.date))
    .limit(limit);

  res.json(rows);
});

export default router;
