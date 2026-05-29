import { useGetDashboardSummary, useGetDashboardActivity, useListAgents } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Activity, Target, CheckCircle2, Users, MessageSquare, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export default function CommandCenter() {
  const { data: summary } = useGetDashboardSummary();
  const { data: activities } = useGetDashboardActivity();
  const { data: agents } = useListAgents();

  const metrics = [
    { title: "Active Goals", value: summary?.activeGoals || 0, icon: Target, color: "text-chart-1" },
    { title: "Completed Tasks", value: summary?.completedTasks || 0, icon: CheckCircle2, color: "text-chart-3" },
    { title: "Active Agents", value: summary?.activeAgents || 0, icon: Users, color: "text-chart-4" },
    { title: "Messages Processed", value: summary?.totalMessages || 0, icon: MessageSquare, color: "text-chart-2" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight glow-text">Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time overview of the autonomous AI workforce.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-chart-3/30 bg-chart-3/10 text-chart-3 text-sm font-mono glow-success">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3"></span>
          </span>
          SYSTEM NOMINAL
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card border-white/10 overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-4 opacity-20 ${metric.color}`}>
                <metric.icon className="h-12 w-12" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold font-mono">{metric.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {activities?.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-primary-foreground">{activity.agentName}</span>
                        <span className="text-muted-foreground"> ({activity.agentRole}) </span>
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {!activities?.length && (
                  <div className="text-center text-muted-foreground py-8">No recent activity</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-secondary" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {agents?.map((agent) => {
                  let statusColor = "bg-muted";
                  let glowClass = "";
                  
                  if (agent.status === "working") {
                    statusColor = "bg-chart-3";
                    glowClass = "glow-success";
                  } else if (agent.status === "thinking") {
                    statusColor = "bg-primary";
                    glowClass = "glow-primary animate-pulse";
                  } else if (agent.status === "meeting") {
                    statusColor = "bg-chart-2";
                    glowClass = "glow-secondary";
                  }

                  return (
                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${statusColor} ${glowClass}`} />
                        <div>
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <div className="text-xs font-mono uppercase text-muted-foreground">
                        {agent.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
