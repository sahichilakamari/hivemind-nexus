import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListSimulations, useCreateSimulation, useGetSimulation,
  useListGoals, getListSimulationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { History, Plus, Loader2, Zap, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending: { color: "text-muted-foreground", icon: Clock },
  running: { color: "text-chart-5", icon: Loader2 },
  completed: { color: "text-chart-3", icon: CheckCircle2 },
  failed: { color: "text-destructive", icon: AlertTriangle },
};

const TIMEFRAMES = ["1 month", "3 months", "6 months", "1 year", "2 years", "5 years"];

function SimulationCard({ sim }: { sim: { id: number; timeframe: string; status: string; summary?: string | null; predictions?: string | null; createdAt: string; goalId: number } }) {
  const { data: detail } = useGetSimulation(sim.id, {
    query: {
      enabled: sim.status === "running",
      queryKey: ["getSimulation", sim.id] as unknown as readonly unknown[],
      refetchInterval: sim.status === "running" ? 3000 : false,
    }
  });
  const current = detail || sim;
  const status = STATUS_CONFIG[current.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  let predictions: Record<string, { value: number; unit: string; trend: string; confidence: number }> | null = null;
  try {
    if (current.predictions) predictions = JSON.parse(current.predictions);
  } catch {}

  return (
    <Card className="glass-card border-white/10" data-testid={`simulation-card-${sim.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${status.color} ${current.status === "running" ? "animate-spin" : ""}`} />
            Simulation #{sim.id}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-border font-mono">{sim.timeframe}</Badge>
            <Badge variant="outline" className={`text-xs border ${status.color === "text-chart-3" ? "border-chart-3/30 bg-chart-3/10" : "border-border"} ${status.color}`}>
              {current.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {current.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">{current.summary}</p>
        )}
        {predictions && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(predictions).slice(0, 4).map(([key, val]) => {
              if (typeof val !== "object" || !val?.value) return null;
              return (
                <div key={key} className="p-2 rounded bg-muted/30 border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-sm font-mono font-semibold">
                    {val.value?.toLocaleString()} <span className="text-xs text-muted-foreground">{val.unit}</span>
                  </p>
                  {val.trend && (
                    <p className={`text-[10px] mt-0.5 ${val.trend === "up" ? "text-chart-3" : val.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                      {val.trend.toUpperCase()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground font-mono">
          {formatDistanceToNow(new Date(sim.createdAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Simulations() {
  const { data: simulations, isLoading } = useListSimulations();
  const { data: goals } = useListGoals();
  const createSimulation = useCreateSimulation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { handleSubmit, reset, control, formState: { isValid } } = useForm<{ goalId: string; timeframe: string }>();

  const onSubmit = (data: { goalId: string; timeframe: string }) => {
    createSimulation.mutate({ data: { goalId: parseInt(data.goalId), timeframe: data.timeframe } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSimulationsQueryKey() });
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time-Travel Simulations</h1>
          <p className="text-muted-foreground mt-1">Run AI-powered predictions for your business future.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-simulation" disabled={!goals?.length}>
              <Plus className="h-4 w-4" /> New Simulation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Run Future Simulation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Goal</Label>
                <Controller name="goalId" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-sim-goal"><SelectValue placeholder="Select goal..." /></SelectTrigger>
                    <SelectContent>
                      {goals?.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Controller name="timeframe" control={control} rules={{ required: true }} render={({ field }) => (
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-sim-timeframe"><SelectValue placeholder="Select timeframe..." /></SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={createSimulation.isPending || !isValid} data-testid="button-submit-simulation">
                {createSimulation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {createSimulation.isPending ? "Running simulation..." : "Launch Simulation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : simulations?.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-20 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No simulations run yet. Create a goal first, then run your first simulation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...(simulations || [])].reverse().map((sim, i) => (
            <motion.div key={sim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <SimulationCard sim={sim} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
