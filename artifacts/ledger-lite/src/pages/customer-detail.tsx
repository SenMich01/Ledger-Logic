import { Link, useRoute } from "wouter";
import { useGetCustomer } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Phone, Mail, MapPin, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const id = Number(params?.id);

  const { data: customer, isLoading } = useGetCustomer(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) return <div className="text-center py-16 text-muted-foreground">Customer not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/customers"><ArrowLeft className="w-5 h-5" /></Link></Button>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              {customer.phone && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{customer.phone}</p>}
              {customer.email && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" />{customer.email}</p>}
              {customer.address && <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{customer.address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-xl font-bold text-primary mt-1">{formatCurrency(Number(customer.totalPurchases))}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className={`text-xl font-bold mt-1 ${Number(customer.outstandingBalance) > 0 ? "text-destructive" : "text-emerald-600"}`}>
                {formatCurrency(Number(customer.outstandingBalance))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {customer.activeDebts && customer.activeDebts.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Active Debts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {customer.activeDebts.map((debt: any) => (
                <div key={debt.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{debt.description || "Debt"}</p>
                    <p className="text-sm text-muted-foreground">{debt.agingDays} days ago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(Number(debt.balance))}</p>
                    <Badge variant="outline" className="text-xs capitalize">{debt.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {customer.recentTransactions && customer.recentTransactions.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {customer.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      {tx.type === "income" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.category}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <p className={`font-semibold text-sm ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
