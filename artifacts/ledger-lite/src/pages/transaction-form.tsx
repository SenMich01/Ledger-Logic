import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTransaction, useListCustomers, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const INCOME_CATEGORIES = ["Sales", "Services", "Consulting", "Freelance", "Commission", "Other"];
const EXPENSE_CATEGORIES = ["Transport", "Rent", "Supplies", "Utilities", "Salaries", "Marketing", "Food", "Maintenance", "Other"];

export default function TransactionForm() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    paymentMethod: "cash" as "cash" | "bank" | "pos" | "transfer",
    date: new Date().toISOString().split("T")[0],
    customerId: "",
  });

  const { data: customers } = useListCustomers();
  const mutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        navigate("/transactions");
      }
    }
  });

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;
    mutation.mutate({
      data: {
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        description: form.description || undefined,
        paymentMethod: form.paymentMethod,
        date: new Date(form.date).toISOString(),
        customerId: form.customerId ? Number(form.customerId) : null,
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/transactions"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Transaction</h1>
          <p className="text-muted-foreground text-sm">Record a new income or expense</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-1">
              {(["income", "expense"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, category: "" }))}
                  className={`py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    form.type === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="transfer">Mobile Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What was this for?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Customer (optional)</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No customer</SelectItem>
                  {customers?.data?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Transaction"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
