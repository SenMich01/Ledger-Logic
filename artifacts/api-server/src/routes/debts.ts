import { Router } from "express";
import { db, debtsTable, customersTable } from "@workspace/db";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import {
  CreateDebtBody,
  UpdateDebtBody,
  ListDebtsQueryParams,
  GetDebtParams,
  UpdateDebtParams,
  DeleteDebtParams,
  MarkDebtPaidParams,
} from "@workspace/api-zod";

const router = Router();

function calcAgingDays(createdAt: Date): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

router.get("/summary", async (req, res): Promise<void> => {
  const debts = await db
    .select()
    .from(debtsTable)
    .where(ne(debtsTable.status, "paid"));

  let totalOutstanding = 0;
  let current = 0;
  let overdue7Days = 0;
  let overdue30Days = 0;
  let overdue60Days = 0;
  const debtorIds = new Set<number>();

  for (const d of debts) {
    const balance = Number(d.amount) - Number(d.amountPaid);
    const days = calcAgingDays(d.createdAt);
    totalOutstanding += balance;
    debtorIds.add(d.customerId);
    if (days <= 7) current += balance;
    else if (days <= 30) overdue7Days += balance;
    else if (days <= 60) overdue30Days += balance;
    else overdue60Days += balance;
  }

  res.json({
    totalOutstanding,
    current,
    overdue7Days,
    overdue30Days,
    overdue60Days,
    totalDebtors: debtorIds.size,
  });
});

router.get("/", async (req, res): Promise<void> => {
  const parsed = ListDebtsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customerId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (customerId) conditions.push(eq(debtsTable.customerId, customerId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: debtsTable.id,
        customerId: debtsTable.customerId,
        customerName: customersTable.name,
        amount: debtsTable.amount,
        amountPaid: debtsTable.amountPaid,
        description: debtsTable.description,
        dueDate: debtsTable.dueDate,
        status: debtsTable.status,
        createdAt: debtsTable.createdAt,
        updatedAt: debtsTable.updatedAt,
      })
      .from(debtsTable)
      .leftJoin(customersTable, eq(debtsTable.customerId, customersTable.id))
      .where(whereClause)
      .orderBy(desc(debtsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(debtsTable).where(whereClause),
  ]);

  const enriched = rows.map(d => ({
    ...d,
    balance: Number(d.amount) - Number(d.amountPaid),
    agingDays: calcAgingDays(d.createdAt),
  }));

  res.json({ data: enriched, total: Number(countRows[0].count), page, limit });
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateDebtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customerId, amount, description, dueDate } = parsed.data;

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, customerId)).then(r => r[0]);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [debt] = await db.insert(debtsTable).values({
    customerId,
    amount: String(amount),
    description: description ?? null,
    dueDate: dueDate ? new Date(dueDate) : null,
    status: "active",
  }).returning();

  await db
    .update(customersTable)
    .set({ outstandingBalance: sql`${customersTable.outstandingBalance} + ${amount}` })
    .where(eq(customersTable.id, customerId));

  res.status(201).json({
    ...debt,
    customerName: customer.name,
    balance: Number(debt.amount) - Number(debt.amountPaid),
    agingDays: 0,
  });
});

router.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetDebtParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: debtsTable.id,
      customerId: debtsTable.customerId,
      customerName: customersTable.name,
      amount: debtsTable.amount,
      amountPaid: debtsTable.amountPaid,
      description: debtsTable.description,
      dueDate: debtsTable.dueDate,
      status: debtsTable.status,
      createdAt: debtsTable.createdAt,
      updatedAt: debtsTable.updatedAt,
    })
    .from(debtsTable)
    .leftJoin(customersTable, eq(debtsTable.customerId, customersTable.id))
    .where(eq(debtsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Debt not found" });
    return;
  }
  res.json({ ...row, balance: Number(row.amount) - Number(row.amountPaid), agingDays: calcAgingDays(row.createdAt) });
});

router.put("/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateDebtParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateDebtBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  const { amount, amountPaid, description, dueDate, status } = bodyParsed.data;
  if (amount !== undefined) updates.amount = String(amount);
  if (amountPaid !== undefined) updates.amountPaid = String(amountPaid);
  if (description !== undefined) updates.description = description;
  if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
  if (status !== undefined) updates.status = status;

  const [debt] = await db
    .update(debtsTable)
    .set(updates)
    .where(eq(debtsTable.id, paramsParsed.data.id))
    .returning();

  if (!debt) {
    res.status(404).json({ error: "Debt not found" });
    return;
  }

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, debt.customerId)).then(r => r[0]);
  res.json({
    ...debt,
    customerName: customer?.name ?? null,
    balance: Number(debt.amount) - Number(debt.amountPaid),
    agingDays: calcAgingDays(debt.createdAt),
  });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteDebtParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(debtsTable).where(eq(debtsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/:id/mark-paid", async (req, res): Promise<void> => {
  const parsed = MarkDebtPaidParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(debtsTable).where(eq(debtsTable.id, parsed.data.id)).then(r => r[0]);
  if (!existing) {
    res.status(404).json({ error: "Debt not found" });
    return;
  }

  const [debt] = await db
    .update(debtsTable)
    .set({ amountPaid: existing.amount, status: "paid" })
    .where(eq(debtsTable.id, parsed.data.id))
    .returning();

  const balanceDiff = Number(existing.amount) - Number(existing.amountPaid);
  if (balanceDiff > 0) {
    await db
      .update(customersTable)
      .set({ outstandingBalance: sql`GREATEST(0, ${customersTable.outstandingBalance} - ${balanceDiff})` })
      .where(eq(customersTable.id, existing.customerId));
  }

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, debt.customerId)).then(r => r[0]);
  res.json({
    ...debt,
    customerName: customer?.name ?? null,
    balance: 0,
    agingDays: calcAgingDays(debt.createdAt),
  });
});

export default router;
