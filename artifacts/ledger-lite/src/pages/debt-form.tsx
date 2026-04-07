import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateDebt, useListCustomers, getListDebtsQueryKey, getGetDebtSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export default function DebtForm() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ customerId: "", amount: "", description: "", dueDate: "" });

  const { data: customers } = useListCustomers();
  const mutation = useCreateDebt({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDebtSummaryQueryKey() });
        navigate("/debts");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.amount) return;
    mutation.mutate({
      data: {
        customerId: Number(form.customerId),
        amount: Number(form.amount),
        description: form.description || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/debts"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Debt Record</h1>
          <p className="text-muted-foreground text-sm">Record money owed by a customer</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.data?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Owed (₦) *</Label>
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required className="text-lg font-semibold" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What is this debt for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending || !form.customerId}>
              {mutation.isPending ? "Saving..." : "Record Debt"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
