import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const debtsTable = pgTable("debts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  description: text("description"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: text("status").notNull().default("active"), // active | paid | partial
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDebtSchema = createInsertSchema(debtsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Debt = typeof debtsTable.$inferSelect;
