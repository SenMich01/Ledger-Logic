import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetCashFlow,
  getGetCashFlowQueryKey,
  useGetDashboardRecentTransactions,
  getGetDashboardRecentTransactionsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary, refetch: refetchSummary } = useGetDashboardSummary(
    { period: "month" },
    { query: { queryKey: getGetDashboardSummaryQueryKey({ period: "month" }) } }
  );

  const { data: cashFlow, isLoading: isLoadingCashFlow, isError: isErrorCashFlow, refetch: refetchCashFlow } = useGetCashFlow(
    { period: "month" },
    { query: { queryKey: getGetCashFlowQueryKey({ period: "month" }) } }
  );

  const { data: recentTransactions, isLoading: isLoadingRecent, isError: isErrorRecent, refetch: refetchRecent } = useGetDashboardRecentTransactions(
    { limit: 5 },
    { query: { queryKey: getGetDashboardRecentTransactionsQueryKey({ limit: 5 }) } }
  );

  if (isErrorSummary || isErrorCashFlow || isErrorRecent) {
    return <ErrorState retry={() => {
      refetchSummary();
      refetchCashFlow();
      refetchRecent();
    }} />;
  }

  if (isLoadingSummary || !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="hover-elevate">
            <Link href="/transactions/new">Add Transaction</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-md bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary.profit)}</div>
            <p className="text-sm opacity-80 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-sm text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</div>
            <p className="text-sm text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCashFlow ? (
              <Skeleton className="w-full h-[300px]" />
            ) : cashFlow && cashFlow.data.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlow.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--emerald-500))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--emerald-500))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                      }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(val) => `₦${(val / 1000)}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      labelFormatter={(label) => formatDate(label)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-orange-600" />
                </div>
                <CardTitle className="text-base font-semibold">Outstanding Debts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.outstandingDebts)}</div>
              <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground mt-2" asChild>
                <Link href="/debts">View all debts →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-base font-semibold">Pending Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.pendingInvoices}</div>
              <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground mt-2" asChild>
                <Link href="/invoices">Manage invoices →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" size="sm" asChild className="hover-elevate">
            <Link href="/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.customerName || tx.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No recent transactions found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
