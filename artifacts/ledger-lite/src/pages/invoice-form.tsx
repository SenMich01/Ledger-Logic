import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateInvoice, useListCustomers, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface InvoiceItem { description: string; quantity: number; unitPrice: number; }

export default function InvoiceForm() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  const { data: customers } = useListCustomers();
  const mutation = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        navigate("/invoices");
      }
    }
  });

  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const subtotal = items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    mutation.mutate({
      data: {
        customerId: Number(customerId),
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || null,
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/invoices"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground text-sm">Create a new invoice for a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.data?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-1">
                  {i === 0 && <Label className="text-xs">Description</Label>}
                  <Input placeholder="Item description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} required />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Qty</Label>}
                  <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} />
                </div>
                <div className="col-span-3 space-y-1">
                  {i === 0 && <Label className="text-xs">Unit Price</Label>}
                  <Input type="number" min="0" placeholder="0" value={item.unitPrice || ""} onChange={e => updateItem(i, "unitPrice", Number(e.target.value))} />
                </div>
                <div className="col-span-1 space-y-1 text-right">
                  {i === 0 && <Label className="text-xs invisible">Total</Label>}
                  <p className="text-sm font-medium py-2">{formatCurrency(item.quantity * item.unitPrice)}</p>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(subtotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Any additional notes for the customer..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={mutation.isPending || !customerId}>
          {mutation.isPending ? "Creating..." : "Create Invoice"}
        </Button>
      </form>
    </div>
  );
}
