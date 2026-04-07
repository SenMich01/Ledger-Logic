import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
// We will import the other pages as we create them
import Transactions from "@/pages/transactions";
import TransactionForm from "@/pages/transaction-form";
import Customers from "@/pages/customers";
import CustomerDetail from "@/pages/customer-detail";
import CustomerForm from "@/pages/customer-form";
import Invoices from "@/pages/invoices";
import InvoiceForm from "@/pages/invoice-form";
import InvoiceDetail from "@/pages/invoice-detail";
import Debts from "@/pages/debts";
import DebtForm from "@/pages/debt-form";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/transactions/new" component={TransactionForm} />
        <Route path="/customers" component={Customers} />
        <Route path="/customers/new" component={CustomerForm} />
        <Route path="/customers/:id" component={CustomerDetail} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/new" component={InvoiceForm} />
        <Route path="/invoices/:id" component={InvoiceDetail} />
        <Route path="/debts" component={Debts} />
        <Route path="/debts/new" component={DebtForm} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
