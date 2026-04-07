import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices, useDeleteInvoice, useMarkInvoicePaid, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, ChevronRight, CheckCircle, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function Invoices() {
  const [status, setStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const params: Record<string, string> = {};
  if (status !== "all") params.status = status;

  const { data, isLoading } = useListInvoices(params as any, {
    query: { queryKey: getListInvoicesQueryKey(params as any) }
  });

  const deleteMutation = useDeleteInvoice({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() }) }
  });

  const markPaidMutation = useMarkInvoicePaid({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() }) }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer invoices</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new"><Plus className="w-4 h-4 mr-2" />New Invoice</Link>
        </Button>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y">
              {data.data.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{inv.invoiceNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[inv.status]}`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{inv.customerName}</p>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatCurrency(Number(inv.total))}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {inv.status !== "paid" && (
                      <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => markPaidMutation.mutate({ id: inv.id })}>
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
                          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                          <AlertDialogDescription>Delete {inv.invoiceNumber}? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: inv.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Link href={`/invoices/${inv.id}`}><ChevronRight className="w-5 h-5 text-muted-foreground" /></Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm mt-1">Create your first invoice to start billing customers</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
