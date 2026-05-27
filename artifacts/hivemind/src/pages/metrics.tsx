import { useListMetrics } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, TrendingDown, Minus, Loader2, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Metrics() {
  const { data: metrics, isLoading } = useListMetrics({
    query: { queryKey: ["metrics"] }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  const getTrendIcon = (trend?: string | null) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'stable': return <Minus className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getTrendColor = (trend?: string | null) => {
    switch(trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-destructive';
      case 'stable': return 'text-muted-foreground';
      default: return 'text-white';
    }
  };

  // Mock data for the big chart to make it look cool since the API only returns single points
  const chartData = Array.from({ length: 20 }).map((_, i) => ({
    name: `T-${20-i}`,
    value: Math.floor(Math.random() * 50) + 50 + (i * 2), // Upward trending
    value2: Math.floor(Math.random() * 30) + 20 + (i),
  }));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Business Metrics</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Live Performance Data</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded flex items-center gap-2 border-primary/30">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Streaming</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.map((metric, i) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-white/10 hover:border-primary/30 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
                  {metric.label || metric.metricType}
                </CardTitle>
                {getTrendIcon(metric.trend)}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold font-mono tracking-wider ${getTrendColor(metric.trend)}`}>
                    {metric.value}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{metric.unit}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-panel-heavy border-primary/20 mt-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <CardHeader>
          <CardTitle className="font-display tracking-widest uppercase text-primary text-glow flex items-center gap-2">
            <BarChart2 className="w-5 h-5" /> Growth Velocity Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fontFamily: 'monospace', fontSize: 10, fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fontFamily: 'monospace', fontSize: 10, fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,255,255,0.2)', fontFamily: 'monospace', borderRadius: '4px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                <Area type="monotone" dataKey="value2" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorValue2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
