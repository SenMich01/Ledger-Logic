import { Link, useRoute } from "wouter";
import { useGetInvoice, useMarkInvoicePaid, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function InvoiceDetail() {
  const [, params] = useRoute("/invoices/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useGetInvoice(id, { query: { enabled: !!id } });
  const markPaidMutation = useMarkInvoicePaid({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() }) }
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!invoice) return <div className="text-center py-16 text-muted-foreground">Invoice not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/invoices"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[invoice.status]}`}>{invoice.status}</span>
          </div>
        </div>
        {invoice.status !== "paid" && (
          <Button onClick={() => markPaidMutation.mutate({ id: invoice.id })} disabled={markPaidMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle className="w-4 h-4 mr-2" />Mark as Paid
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold">{invoice.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-sm text-muted-foreground">Paid On</p>
                <p className="font-semibold text-emerald-600">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(invoice.items as any[]).map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 text-sm">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-3 text-sm font-medium text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td colSpan={3} className="px-6 py-4 text-right font-semibold">Total</td>
                <td className="px-6 py-4 text-right font-bold text-lg text-primary">{formatCurrency(Number(invoice.total))}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p>{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
