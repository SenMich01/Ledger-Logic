import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function CustomerForm() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const mutation = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        navigate("/customers");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    mutation.mutate({
      data: {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/customers"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Customer</h1>
          <p className="text-muted-foreground text-sm">Add a new customer to your records</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Amaka Okafor" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="e.g. 08012345678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="e.g. amaka@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="e.g. 15 Lagos Street, Ikeja" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Add Customer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
