import { useState } from "react";
import { useGetProfitLossReport, useGetExpenseBreakdown, useGetRevenueBreakdown, getGetProfitLossReportQueryKey, getGetExpenseBreakdownQueryKey, getGetRevenueBreakdownQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(1);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default function Reports() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [applied, setApplied] = useState({ startDate: defaults.start, endDate: defaults.end });

  const params = { startDate: applied.startDate, endDate: applied.endDate };

  const { data: report, isLoading } = useGetProfitLossReport(params, {
    query: { queryKey: getGetProfitLossReportQueryKey(params) }
  });

  const { data: expenses } = useGetExpenseBreakdown(params, {
    query: { queryKey: getGetExpenseBreakdownQueryKey(params) }
  });

  const { data: revenue } = useGetRevenueBreakdown(params, {
    query: { queryKey: getGetRevenueBreakdownQueryKey(params) }
  });

  const handleApply = () => setApplied({ startDate, endDate });

  const plData = report ? [
    { name: "Revenue", amount: report.totalRevenue },
    { name: "Expenses", amount: report.totalExpenses },
    { name: "Profit", amount: report.grossProfit },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Analyze your business performance</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-5">
                <p className="text-sm opacity-80">Net Profit</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(report.grossProfit)}</p>
                <p className="text-sm opacity-70 mt-1">Margin: {report.profitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(report.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(report.totalExpenses)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Revenue vs Expenses vs Profit</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(v: number) => [formatCurrency(v), ""]} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "var(--shadow-md)" }} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {plData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#10b981" : i === 1 ? "#ef4444" : "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expenses && expenses.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenses} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`} labelLine={false}>
                          {expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(v: number) => [formatCurrency(v), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {expenses.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span>{item.category}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {revenue && revenue.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-base">Revenue Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenue} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`} labelLine={false}>
                          {revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(v: number) => [formatCurrency(v), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {revenue.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span>{item.category}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>No data for the selected period</p>
        </div>
      )}
    </div>
  );
}
