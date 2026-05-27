import { useListAgents } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Bot, Activity, Zap, BrainCircuit, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Headquarters() {
  const { data: agents, isLoading } = useListAgents({
    query: { queryKey: ["agents"] }
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-mono tracking-widest animate-pulse text-glow">LOADING AGENT NETWORK...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-muted-foreground';
      case 'thinking': return 'bg-secondary animate-pulse';
      case 'working': return 'bg-primary animate-pulse';
      case 'meeting': return 'bg-amber-400';
      case 'offline': return 'bg-destructive';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Headquarters</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">AI Executive Team</p>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-mono text-primary text-sm uppercase tracking-widest">{agents?.length || 0} Agents Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents?.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel-heavy overflow-hidden relative group hover:border-primary/50 transition-colors h-full">
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ backgroundColor: agent.avatarColor || 'var(--primary)' }}
              ></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: `${agent.avatarColor}20` || 'rgba(0,255,255,0.1)', border: `1px solid ${agent.avatarColor || 'var(--primary)'}` }}
                    >
                      <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"></div>
                      <Bot className="w-6 h-6" style={{ color: agent.avatarColor || 'var(--primary)' }} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider leading-none mb-1">{agent.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground uppercase">{agent.role}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} shadow-[var(--shadow-glow)]`}></div>
                  <span className="text-xs font-mono text-muted-foreground uppercase">{agent.status}</span>
                </div>
                
                <div className="bg-white/5 rounded p-3 border border-white/10 min-h-[60px]">
                  <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Current Task</p>
                  <p className="text-sm text-foreground line-clamp-2">{agent.currentTask || "Awaiting directives..."}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase">
                    <span>Productivity</span>
                    <span className="text-primary">{agent.productivityScore}%</span>
                  </div>
                  <Progress value={agent.productivityScore} className="h-1" indicatorColor="bg-primary" />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase border-white/20 text-muted-foreground">
                    {agent.model || 'NEXUS-7'}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
                    <Activity className="w-3 h-3 text-primary" />
                    <span>Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
