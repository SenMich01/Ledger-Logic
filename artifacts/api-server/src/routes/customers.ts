import { Router } from "express";
import { db, customersTable, transactionsTable, debtsTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  ListCustomersQueryParams,
  GetCustomerParams,
  UpdateCustomerParams,
  DeleteCustomerParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const whereClause = search ? ilike(customersTable.name, `%${search}%`) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(customersTable)
      .where(whereClause)
      .orderBy(desc(customersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(customersTable).where(whereClause),
  ]);

  res.json({ data: rows, total: Number(countRows[0].count), page, limit });
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [customer] = await db.insert(customersTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    address: parsed.data.address ?? null,
  }).returning();
  res.status(201).json(customer);
});

router.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetCustomerParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const customer = await db.select().from(customersTable).where(eq(customersTable.id, parsed.data.id)).then(r => r[0]);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [recentTransactions, activeDebts] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.customerId, parsed.data.id))
      .orderBy(desc(transactionsTable.date))
      .limit(10),
    db
      .select()
      .from(debtsTable)
      .where(eq(debtsTable.customerId, parsed.data.id))
      .orderBy(desc(debtsTable.createdAt)),
  ]);

  const debtsWithExtra = activeDebts.map(d => ({
    ...d,
    customerName: customer.name,
    balance: Number(d.amount) - Number(d.amountPaid),
    agingDays: Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  res.json({
    ...customer,
    recentTransactions: recentTransactions.map(t => ({ ...t, customerName: customer.name })),
    activeDebts: debtsWithExtra,
  });
});

router.put("/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateCustomerParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateCustomerBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  const { name, phone, email, address } = bodyParsed.data;
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (address !== undefined) updates.address = address;

  const [customer] = await db
    .update(customersTable)
    .set(updates)
    .where(eq(customersTable.id, paramsParsed.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(customer);
});

router.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteCustomerParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(customersTable).where(eq(customersTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
