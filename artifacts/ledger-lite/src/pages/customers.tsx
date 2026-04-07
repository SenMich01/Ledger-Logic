import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, useDeleteCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, User, ChevronRight, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Customers() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useListCustomers(
    search ? { search } : undefined,
    { query: { queryKey: getListCustomersQueryKey(search ? { search } : undefined) } }
  );

  const deleteMutation = useDeleteCustomer({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
        </div>
        <Button asChild>
          <Link href="/customers/new"><Plus className="w-4 h-4 mr-2" />Add Customer</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y">
              {data.data.map(customer => (
                <div key={customer.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone || customer.email || "No contact info"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(Number(customer.totalPurchases))}</p>
                    {Number(customer.outstandingBalance) > 0 && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Owes {formatCurrency(Number(customer.outstandingBalance))}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={e => e.stopPropagation()}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete {customer.name}. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate({ id: customer.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Link href={`/customers/${customer.id}`}>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No customers yet</p>
              <p className="text-sm mt-1">Add your first customer to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
