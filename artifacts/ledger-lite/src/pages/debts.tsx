import { Link } from "wouter";
import { useListDebts, useGetDebtSummary, useMarkDebtPaid, useDeleteDebt, getListDebtsQueryKey, getGetDebtSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CreditCard, CheckCircle, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

function AgingBadge({ days }: { days: number }) {
  if (days <= 7) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">Current</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">{days}d overdue</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">{days}d overdue</Badge>;
}

export default function Debts() {
  const queryClient = useQueryClient();

  const { data: summary } = useGetDebtSummary({
    query: { queryKey: getGetDebtSummaryQueryKey() }
  });

  const { data, isLoading } = useListDebts(undefined, {
    query: { queryKey: getListDebtsQueryKey() }
  });

  const markPaidMutation = useMarkDebtPaid({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDebtSummaryQueryKey() });
      }
    }
  });

  const deleteMutation = useDeleteDebt({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDebtSummaryQueryKey() });
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debt Tracker</h1>
          <p className="text-muted-foreground mt-1">Track what customers owe you</p>
        </div>
        <Button asChild>
          <Link href="/debts/new"><Plus className="w-4 h-4 mr-2" />Add Debt</Link>
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm bg-orange-50">
            <CardContent className="p-4">
              <p className="text-xs text-orange-600 font-medium">Total Outstanding</p>
              <p className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(summary.totalOutstanding)}</p>
              <p className="text-xs text-orange-600 mt-1">{summary.totalDebtors} debtors</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Current</p>
              <p className="text-lg font-bold mt-1">{formatCurrency(summary.current)}</p>
              <p className="text-xs text-muted-foreground mt-1">0-7 days</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium">7-30 days</p>
              <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(summary.overdue7Days)}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-red-600 font-medium">30+ days</p>
              <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(summary.overdue30Days + summary.overdue60Days)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y">
              {data.data.map(debt => (
                <div key={debt.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{debt.customerName}</span>
                      <AgingBadge days={debt.agingDays} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {debt.description || "Debt record"}
                      {debt.dueDate ? ` · Due ${formatDate(debt.dueDate)}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-orange-700">{formatCurrency(Number(debt.balance))}</p>
                    {Number(debt.amountPaid) > 0 && (
                      <p className="text-xs text-muted-foreground">Paid: {formatCurrency(Number(debt.amountPaid))}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {debt.status !== "paid" && (
                      <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => markPaidMutation.mutate({ id: debt.id })}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Debt Record</AlertDialogTitle>
                          <AlertDialogDescription>Delete this debt record for {debt.customerName}? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: debt.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No outstanding debts</p>
              <p className="text-sm mt-1">All balances are settled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
