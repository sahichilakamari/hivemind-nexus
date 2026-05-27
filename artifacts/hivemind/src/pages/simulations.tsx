import { useListSimulations, useCreateSimulation, getListSimulationsQueryKey, useListGoals } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Play, Eye, Loader2, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Simulations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ goalId: "", timeframe: "6 months" });

  const { data: simulations, isLoading } = useListSimulations({
    query: { queryKey: ["simulations"] }
  });

  const { data: goals } = useListGoals({
    query: { queryKey: ["goals"] }
  });

  const createSimulation = useCreateSimulation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSimulationsQueryKey() });
        setIsDialogOpen(false);
        toast({ title: "Simulation Running", description: "Calculating future vectors." });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.goalId) return;
    createSimulation.mutate({ 
      data: { 
        goalId: parseInt(formData.goalId), 
        timeframe: formData.timeframe 
      } 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-secondary border-secondary/30 bg-secondary/10';
      case 'completed': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'failed': return 'text-destructive border-destructive/30 bg-destructive/10';
      default: return 'text-muted-foreground border-white/10 bg-white/5';
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-secondary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow-purple mb-1 text-white">Time-Travel Predictions</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Predictive Modeling Engine</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[var(--shadow-glow-purple)] uppercase font-bold tracking-widest" data-testid="button-create-sim">
              <Play className="w-4 h-4 mr-2" /> Run Simulation
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-heavy border-secondary/30 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-secondary text-glow-purple flex items-center gap-2">
                <Timer className="w-5 h-5" /> Vector Calculation
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Target Directive</label>
                <Select value={formData.goalId} onValueChange={(val) => setFormData({...formData, goalId: val})}>
                  <SelectTrigger className="bg-black/50 border-white/10 font-mono focus-visible:ring-secondary">
                    <SelectValue placeholder="Select objective to simulate" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 font-mono">
                    {goals?.map(g => (
                      <SelectItem key={g.id} value={g.id.toString()}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Timeframe Horizon</label>
                <Input 
                  value={formData.timeframe}
                  onChange={e => setFormData({...formData, timeframe: e.target.value})}
                  placeholder="e.g. 6 months, 1 year, 5 years"
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-secondary focus-visible:border-secondary"
                  required
                />
              </div>
              <Button type="submit" disabled={createSimulation.isPending} className="w-full bg-secondary hover:bg-secondary/90 text-black font-bold uppercase tracking-widest mt-4 shadow-[var(--shadow-glow-purple)]">
                {createSimulation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
                Calculate Futures
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {simulations?.map((sim, i) => (
          <motion.div
            key={sim.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-secondary/20 hover:border-secondary/50 transition-all duration-300 relative overflow-hidden h-full flex flex-col group">
              {sim.status === 'running' && (
                 <div className="absolute inset-0 bg-secondary/5 animate-pulse pointer-events-none"></div>
              )}
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                      <Timer className="w-4 h-4 text-secondary" /> Horizon: {sim.timeframe}
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground uppercase mt-1">Goal ID: NX-{sim.goalId}</p>
                  </div>
                  <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-widest ${getStatusColor(sim.status)}`}>
                    {sim.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin mr-1 inline" /> : null}
                    {sim.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-5 flex flex-col bg-black/20">
                {sim.status === 'running' ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4">
                     <GitBranch className="w-12 h-12 text-secondary/50 animate-pulse" />
                     <p className="font-mono text-xs text-secondary/70 uppercase tracking-widest">Simulating possible realities...</p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-display uppercase tracking-widest text-sm text-secondary mb-2 text-glow-purple">Analysis Summary</h4>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed mb-6 flex-1">
                      {sim.summary || "Simulation data corrupted."}
                    </p>
                    
                    {sim.predictions && (
                      <div className="bg-white/5 border border-white/10 rounded p-3 mt-auto">
                        <h5 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Key Vectors</h5>
                        <p className="text-xs font-mono text-white/80 line-clamp-3">{sim.predictions}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
