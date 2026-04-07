import { useState } from "react";
import { Link } from "wouter";
import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const CATEGORIES = ["All", "Sales", "Services", "Transport", "Rent", "Supplies", "Utilities", "Other"];

export default function Transactions() {
  const [type, setType] = useState<string>("all");
  const [category, setCategory] = useState<string>("All");
  const queryClient = useQueryClient();

  const params: Record<string, string> = {};
  if (type !== "all") params.type = type;
  if (category !== "All") params.category = category;

  const { data, isLoading } = useListTransactions(params as any, {
    query: { queryKey: getListTransactionsQueryKey(params as any) }
  });

  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">Track all your income and expenses</p>
        </div>
        <Button asChild>
          <Link href="/transactions/new"><Plus className="w-4 h-4 mr-2" />Add Transaction</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y">
              {data.data.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}>
                      {tx.type === "income" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tx.category}</span>
                        <Badge variant="outline" className="text-xs capitalize">{tx.paymentMethod}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tx.customerName || tx.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this transaction. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: tx.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Add your first income or expense to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ArrowRightLeft({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>;
}
