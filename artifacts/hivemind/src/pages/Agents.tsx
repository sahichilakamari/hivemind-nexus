import { motion } from "framer-motion";
import { useListAgents, useGetAgentNetwork } from "@workspace/api-client-react";
import { Users, BrainCircuit, Zap, Coffee, Radio, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG = {
  idle: { label: "Idle", color: "text-muted-foreground", bg: "bg-muted", icon: Coffee, glow: "" },
  thinking: { label: "Thinking", color: "text-chart-1", bg: "bg-chart-1", icon: BrainCircuit, glow: "glow-primary" },
  working: { label: "Working", color: "text-chart-3", bg: "bg-chart-3", icon: Zap, glow: "glow-success" },
  meeting: { label: "Meeting", color: "text-chart-2", bg: "bg-chart-2", icon: Radio, glow: "glow-secondary" },
  offline: { label: "Offline", color: "text-muted-foreground/40", bg: "bg-muted/30", icon: WifiOff, glow: "" },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  CEO: "Strategic vision & final decisions",
  CFO: "Financial intelligence & risk analysis",
  CTO: "Technical architecture & innovation",
  CMO: "Brand strategy & market growth",
  COO: "Operations & execution excellence",
  CLO: "Legal compliance & risk management",
  CHRO: "Talent, culture & workforce planning",
  CIO: "Data intelligence & information systems",
};

export default function Agents() {
  const { data: agents, isLoading } = useListAgents();
  const { data: network } = useGetAgentNetwork();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Network</h1>
        <p className="text-muted-foreground mt-1">Your autonomous AI C-suite workforce.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["idle", "thinking", "working", "meeting"].map(status => {
          const count = agents?.filter(a => a.status === status).length || 0;
          const conf = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const Icon = conf.icon;
          return (
            <Card key={status} className="glass-card border-white/10">
              <CardContent className="py-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50`}>
                  <Icon className={`h-4 w-4 ${conf.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{count}</p>
                  <p className="text-xs text-muted-foreground">{conf.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents?.map((agent, i) => {
            const status = STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.idle;
            const StatusIcon = status.icon;
            return (
              <motion.div key={agent.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card
                  className={`glass-card border-white/10 hover:border-primary/30 transition-all duration-300 ${agent.status !== "idle" && agent.status !== "offline" ? "hover:shadow-[0_0_20px_rgba(100,50,255,0.15)]" : ""}`}
                  data-testid={`agent-card-${agent.id}`}
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm border border-white/20 ${status.glow}`}
                          style={{ backgroundColor: agent.avatarColor }}
                        >
                          {agent.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold font-mono text-sm">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${status.bg} ${agent.status === "thinking" ? "animate-pulse" : agent.status === "working" ? "animate-ping" : ""}`} />
                      </div>
                    </div>

                    <Badge variant="outline" className={`text-[10px] border ${
                      agent.status === "working" ? "border-chart-3/30 bg-chart-3/10 text-chart-3" :
                      agent.status === "thinking" ? "border-chart-1/30 bg-chart-1/10 text-chart-1" :
                      agent.status === "meeting" ? "border-chart-2/30 bg-chart-2/10 text-chart-2" :
                      "border-border text-muted-foreground"
                    }`}>
                      <StatusIcon className="h-2.5 w-2.5 mr-1" />
                      {status.label}
                    </Badge>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-muted-foreground">Productivity</span>
                        <span className="text-xs font-mono font-semibold">{agent.productivityScore.toFixed(0)}%</span>
                      </div>
                      <Progress value={agent.productivityScore} className="h-1.5" />
                    </div>

                    <p className="text-xs text-muted-foreground leading-snug">
                      {ROLE_DESCRIPTIONS[agent.role] || agent.personality.substring(0, 60)}
                    </p>

                    {agent.currentTask && (
                      <div className="text-[10px] font-mono text-chart-5 truncate bg-chart-5/10 px-2 py-1 rounded border border-chart-5/20">
                        {agent.currentTask}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {network && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BrainCircuit className="h-4 w-4 text-primary" />
              Communication Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {network.nodes?.map(node => {
                const edges = network.edges?.filter(e => e.source === node.id || e.target === node.id) || [];
                const activeEdges = edges.filter(e => e.active).length;
                return (
                  <div key={node.id} className="p-3 rounded-lg bg-muted/30 border border-white/5" data-testid={`network-node-${node.agentId}`}>
                    <p className="text-xs font-semibold">{node.label}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Connections</span>
                        <span className="font-mono">{edges.length}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Active</span>
                        <span className={`font-mono ${activeEdges > 0 ? "text-chart-3" : ""}`}>{activeEdges}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Messages</span>
                        <span className="font-mono">{node.communicationCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
