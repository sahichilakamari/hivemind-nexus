import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart2, 
  Bot, 
  Briefcase, 
  FileText, 
  Github, 
  Network, 
  Target, 
  Timer, 
  Users, 
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Command Center", icon: Activity },
  { href: "/headquarters", label: "Headquarters", icon: Bot },
  { href: "/goals", label: "Business Goals", icon: Target },
  { href: "/tasks", label: "Task Force", icon: Briefcase },
  { href: "/meetings", label: "Board Meetings", icon: Users },
  { href: "/metrics", label: "Metrics", icon: BarChart2 },
  { href: "/simulations", label: "Simulations", icon: Timer },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/network", label: "Network", icon: Network },
  { href: "/github", label: "GitHub Sync", icon: Github },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden relative">
      <div className="scanline-effect absolute inset-0 pointer-events-none z-50"></div>
      
      {/* Mobile Nav Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md z-40 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary border-glow">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-glow text-primary">NEXUS</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            className={`
              absolute md:relative z-40 w-64 h-[calc(100vh-65px)] md:h-screen 
              bg-card/90 backdrop-blur-xl border-r border-border
              flex flex-col flex-shrink-0 transition-transform duration-300
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
          >
            <div className="p-6 hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/20 border border-primary flex items-center justify-center text-primary shadow-[var(--shadow-glow)]">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <div className="font-display font-bold text-2xl tracking-widest text-glow text-primary leading-none">NEXUS</div>
                <div className="text-xs text-primary/60 tracking-widest uppercase mt-1">HiveMind Core</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer
                        ${isActive 
                          ? 'bg-primary/15 text-primary border border-primary/30 shadow-[inset_0_0_10px_rgba(0,255,255,0.1)]' 
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'}
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-glow' : ''}`} />
                      <span className="font-medium text-sm uppercase tracking-wider">{item.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab" 
                          className="absolute left-0 w-1 h-8 bg-primary shadow-[var(--shadow-glow)] rounded-r-md"
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-border mt-auto">
              <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-secondary/10 border border-secondary/20 text-secondary">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[var(--shadow-glow-purple)]"></div>
                <span className="text-xs font-mono tracking-wider">SYSTEM ONLINE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-65px)] md:h-screen relative z-10">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full max-w-7xl mx-auto relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,255,255,0.4);
        }
      `}} />
    </div>
  );
}
