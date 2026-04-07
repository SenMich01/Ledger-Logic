import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/debts", label: "Debts", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-card border-r z-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              L
            </div>
            LedgerLite
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors hover-elevate",
                  isActive 
                    ? "bg-primary text-primary-foreground no-default-hover-elevate" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pb-20 md:pb-0 min-h-[100dvh] flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 px-2 py-2 flex items-center justify-around pb-safe">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
