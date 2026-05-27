import { useGetDashboardSummary, useGetDashboardActivity } from "@workspace/api-client-react";
import { Activity, Target, Users, CheckSquare, MessageSquare, Video, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: ["dashboard", "summary"] }
  });

  const { data: activities, isLoading: isLoadingActivity } = useGetDashboardActivity({
    query: { queryKey: ["dashboard", "activity"] }
  });

  if (isLoadingSummary || isLoadingActivity) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-mono tracking-widest animate-pulse text-glow">INITIALIZING CORE...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Active Agents", value: summary?.activeAgents || 0, icon: Users, color: "text-primary" },
    { title: "Active Goals", value: summary?.totalGoals || 0, icon: Target, color: "text-secondary" },
    { title: "Completed Tasks", value: summary?.completedTasks || 0, icon: CheckSquare, color: "text-emerald-400" },
    { title: "Running Meetings", value: summary?.runningMeetings || 0, icon: Video, color: "text-amber-400" },
    { title: "Total Messages", value: summary?.totalMessages || 0, icon: MessageSquare, color: "text-blue-400" },
    { title: "System Health", value: `${summary?.companyHealth || 0}%`, icon: Activity, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Command Center</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">System Overview & Live Telemetry</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest">
            {summary?.autonomousMode ? "Autonomous Mode: ON" : "Manual Override"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-white/10 hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className={`text-2xl font-bold font-mono tracking-wider ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel-heavy col-span-1 lg:col-span-2 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-primary text-glow flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Telemetry Feed
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
                    className="flex gap-4 items-start p-3 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="mt-1">
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-400" />}
                      {activity.type === 'task' && <CheckSquare className="w-4 h-4 text-emerald-400" />}
                      {activity.type === 'meeting' && <Video className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-mono leading-relaxed">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="text-primary">{activity.agentName}</span>
                        <span>•</span>
                        <span>{activity.agentRole}</span>
                        <span>•</span>
                        <span>{new Date(activity.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!activities || activities.length === 0) && (
                  <div className="text-center text-muted-foreground font-mono text-sm py-10">
                    No recent activity detected.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="glass-panel-heavy border-secondary/20 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
          <CardHeader>
            <CardTitle className="font-display tracking-widest uppercase text-secondary text-glow-purple">
              System Directives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>CPU Load</span>
                  <span className="text-primary">42%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[42%] shadow-[var(--shadow-glow)]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>Memory Allocation</span>
                  <span className="text-secondary">78%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[78%] shadow-[var(--shadow-glow-purple)]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>Network Bandwidth</span>
                  <span className="text-emerald-400">14%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[14%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Active Modules</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">NLP Core</Badge>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">Strategy Engine</Badge>
                <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/10">Creative Synthesis</Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">Data Analytics</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
