import { Router } from "express";
import { db, invoicesTable, customersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  ListInvoicesQueryParams,
  GetInvoiceParams,
  UpdateInvoiceParams,
  DeleteInvoiceParams,
  MarkInvoicePaidParams,
} from "@workspace/api-zod";

const router = Router();

function toInvoiceResponse(inv: Record<string, unknown>, customerName: string) {
  return {
    ...inv,
    customerName,
  };
}

router.get("/", async (req, res): Promise<void> => {
  const parsed = ListInvoicesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, customerId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(invoicesTable.status, status));
  if (customerId) conditions.push(eq(invoicesTable.customerId, customerId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        customerId: invoicesTable.customerId,
        customerName: customersTable.name,
        status: invoicesTable.status,
        items: invoicesTable.items,
        subtotal: invoicesTable.subtotal,
        total: invoicesTable.total,
        dueDate: invoicesTable.dueDate,
        paidAt: invoicesTable.paidAt,
        notes: invoicesTable.notes,
        createdAt: invoicesTable.createdAt,
        updatedAt: invoicesTable.updatedAt,
      })
      .from(invoicesTable)
      .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
      .where(whereClause)
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(invoicesTable).where(whereClause),
  ]);

  res.json({ data: rows, total: Number(countRows[0].count), page, limit });
});

router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { customerId, items, dueDate, notes } = parsed.data;

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, customerId)).then(r => r[0]);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const enrichedItems = items.map(item => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }));
  const subtotal = enrichedItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;

  const count = await db.select({ count: sql<number>`count(*)` }).from(invoicesTable);
  const invoiceNumber = `INV-${String(Number(count[0].count) + 1).padStart(4, "0")}`;

  const [inv] = await db.insert(invoicesTable).values({
    invoiceNumber,
    customerId,
    status: "pending",
    items: enrichedItems,
    subtotal: String(subtotal),
    total: String(total),
    dueDate: new Date(dueDate),
    notes: notes ?? null,
  }).returning();

  res.status(201).json({ ...inv, customerName: customer.name });
});

router.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: invoicesTable.id,
      invoiceNumber: invoicesTable.invoiceNumber,
      customerId: invoicesTable.customerId,
      customerName: customersTable.name,
      status: invoicesTable.status,
      items: invoicesTable.items,
      subtotal: invoicesTable.subtotal,
      total: invoicesTable.total,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      notes: invoicesTable.notes,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
    })
    .from(invoicesTable)
    .leftJoin(customersTable, eq(invoicesTable.customerId, customersTable.id))
    .where(eq(invoicesTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(row);
});

router.put("/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }
  const bodyParsed = UpdateInvoiceBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  const { customerId, items, dueDate, status, notes } = bodyParsed.data;
  if (customerId !== undefined) updates.customerId = customerId;
  if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (items !== undefined) {
    const enrichedItems = items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    updates.items = enrichedItems;
    updates.subtotal = String(enrichedItems.reduce((s, i) => s + i.total, 0));
    updates.total = updates.subtotal;
  }

  const [inv] = await db
    .update(invoicesTable)
    .set(updates)
    .where(eq(invoicesTable.id, paramsParsed.data.id))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, inv.customerId)).then(r => r[0]);
  res.json({ ...inv, customerName: customer?.name ?? null });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteInvoiceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(invoicesTable).where(eq(invoicesTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/:id/mark-paid", async (req, res): Promise<void> => {
  const parsed = MarkInvoicePaidParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inv] = await db
    .update(invoicesTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(invoicesTable.id, parsed.data.id))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const customer = await db.select().from(customersTable).where(eq(customersTable.id, inv.customerId)).then(r => r[0]);
  res.json({ ...inv, customerName: customer?.name ?? null });
});

export default router;
