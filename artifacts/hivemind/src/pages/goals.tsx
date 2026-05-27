import { useListGoals, useCreateGoal, getListGoalsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Goals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", industry: "" });

  const { data: goals, isLoading } = useListGoals({
    query: { queryKey: ["goals"] }
  });

  const createGoal = useCreateGoal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        setIsDialogOpen(false);
        setFormData({ title: "", description: "", industry: "" });
        toast({
          title: "Goal Initialized",
          description: "Agents have been dispatched.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    createGoal.mutate({ data: formData });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'active': return 'text-primary border-primary/30 bg-primary/10';
      case 'completed': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'failed': return 'text-destructive border-destructive/30 bg-destructive/10';
      default: return 'text-primary border-primary/30 bg-primary/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Business Goals</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Strategic Objectives</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)] uppercase font-bold tracking-widest" data-testid="button-create-goal">
              <Plus className="w-4 h-4 mr-2" /> Launch New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-heavy border-primary/30 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-primary text-glow flex items-center gap-2">
                <Rocket className="w-5 h-5" /> Initialize Objective
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Directive Title</label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Launch Q3 Marketing Campaign"
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Parameters</label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed context for the AI swarm..."
                  className="bg-black/50 border-white/10 font-mono min-h-[100px] focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Target Industry</label>
                <Input 
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  placeholder="e.g. FinTech, SaaS, Retail"
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <Button type="submit" disabled={createGoal.isPending} className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest mt-4">
                {createGoal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                Execute Command
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals?.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-panel border-white/10 hover:border-primary/40 transition-all duration-300 group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-white tracking-wide">{goal.title}</CardTitle>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-3 h-3" /> {goal.industry || 'General'}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-mono uppercase tracking-widest border ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{goal.description}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                  <div className="text-xs font-mono text-muted-foreground">
                    INIT: {new Date(goal.createdAt).toLocaleDateString()}
                  </div>
                  <Link href={`/goals/${goal.id}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 uppercase font-mono tracking-widest text-xs group-hover:shadow-[var(--shadow-glow)]">
                      View Telemetry <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {(!goals || goals.length === 0) && (
          <div className="col-span-2 py-20 text-center glass-panel rounded-lg">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-display uppercase tracking-widest text-lg text-white mb-2">No Active Directives</h3>
            <p className="text-muted-foreground font-mono text-sm">Initialize a new goal to activate the swarm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
