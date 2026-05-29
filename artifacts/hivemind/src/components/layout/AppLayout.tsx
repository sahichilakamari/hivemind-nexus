import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  Briefcase, 
  LineChart, 
  History, 
  FileText, 
  Github,
  Activity
} from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: summary } = useGetDashboardSummary();

  const navItems = [
    { name: "Command Center", href: "/", icon: LayoutDashboard },
    { name: "Goals", href: "/goals", icon: Target, badge: summary?.activeGoals },
    { name: "Agents", href: "/agents", icon: Users, badge: summary?.activeAgents },
    { name: "Meetings", href: "/meetings", icon: Users },
    { name: "Tasks", href: "/tasks", icon: Briefcase },
    { name: "Metrics", href: "/metrics", icon: LineChart },
    { name: "Simulations", href: "/simulations", icon: History },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "GitHub Sync", href: "/github", icon: Github },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card/50 backdrop-blur-sm flex flex-col z-10 relative">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 glow-primary">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-primary-foreground">HIVEMIND</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Nexus Protocol</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary/20 text-primary-foreground border border-primary/30 shadow-[0_0_10px_rgba(100,50,255,0.2)]" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}>
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${isActive ? "text-primary glow-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 text-xs text-muted-foreground font-mono">
          <div className="flex justify-between items-center mb-2">
            <span>SYS.STATUS</span>
            <span className="text-chart-3 glow-success">ONLINE</span>
          </div>
          <div className="flex justify-between items-center">
            <span>AUTONOMY</span>
            <span className="text-chart-1">ENGAGED</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
