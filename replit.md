# Workspace

## Overview

LedgerLite — a mobile-first financial management web app for small business owners in Nigeria/Africa. Built as a pnpm workspace monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/ledger-lite)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **UI**: TailwindCSS + shadcn/ui components

## Features

- **Dashboard**: Revenue/expenses/profit summary, cash flow chart, outstanding debts, pending invoices, recent transactions
- **Transactions**: Add/view/delete income & expense transactions with category and payment method
- **Customers**: Customer profiles with purchase history and outstanding balances
- **Invoices**: Create invoices with line items, track paid/pending/overdue status
- **Debt Tracking**: Record customer debts with aging (7d/30d/60d buckets)
- **Reports**: P&L report, expense breakdown chart, revenue breakdown chart
- **Settings**: Business profile stored in localStorage

## DB Schema (lib/db/src/schema/)

- `customers` — customer profiles
- `transactions` — income & expense entries
- `invoices` — invoices with JSON line items
- `debts` — debt records with aging

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
