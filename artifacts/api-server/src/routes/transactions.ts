import { Router } from "express";
import { db, transactionsTable, customersTable } from "@workspace/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  ListTransactionsQueryParams,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { type, category, startDate, endDate, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (startDate) conditions.push(gte(transactionsTable.date, new Date(startDate)));
  if (endDate) conditions.push(lte(transactionsTable.date, new Date(endDate)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
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
      .where(whereClause)
      .orderBy(desc(transactionsTable.date))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(whereClause),
  ]);

  res.json({
    data: rows,
    total: Number(countRows[0].count),
    page,
    limit,
  });
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { type, amount, category, description, paymentMethod, date, customerId } = parsed.data;

  const [tx] = await db.insert(transactionsTable).values({
    type,
    amount: String(amount),
    category,
    description: description ?? null,
    paymentMethod,
    date: new Date(date),
    customerId: customerId ?? null,
  }).returning();

  if (customerId && type === "income") {
    await db
      .update(customersTable)
      .set({
        totalPurchases: sql`${customersTable.totalPurchases} + ${amount}`,
      })
      .where(eq(customersTable.id, customerId));
  }

  const customer = tx.customerId
    ? await db.select().from(customersTable).where(eq(customersTable.id, tx.customerId)).then(r => r[0])
    : null;

  res.status(201).json({ ...tx, customerName: customer?.name ?? null });
});

router.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
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
    .where(eq(transactionsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(row);
});

router.put("/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateTransactionBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  const { type, amount, category, description, paymentMethod, date, customerId } = bodyParsed.data;
  if (type !== undefined) updates.type = type;
  if (amount !== undefined) updates.amount = String(amount);
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
  if (date !== undefined) updates.date = new Date(date);
  if (customerId !== undefined) updates.customerId = customerId;

  const [tx] = await db
    .update(transactionsTable)
    .set(updates)
    .where(eq(transactionsTable.id, paramsParsed.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const customer = tx.customerId
    ? await db.select().from(customersTable).where(eq(customersTable.id, tx.customerId)).then(r => r[0])
    : null;

  res.json({ ...tx, customerName: customer?.name ?? null });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(transactionsTable).where(eq(transactionsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
