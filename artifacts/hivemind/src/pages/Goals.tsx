import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListGoals, useCreateGoal, getListGoalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Target, Plus, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending: { color: "text-chart-5", bg: "bg-chart-5/10 border-chart-5/30", icon: Clock, label: "Pending" },
  active: { color: "text-chart-3", bg: "bg-chart-3/10 border-chart-3/30", icon: Zap, label: "Active" },
  completed: { color: "text-chart-1", bg: "bg-chart-1/10 border-chart-1/30", icon: CheckCircle2, label: "Completed" },
  failed: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", icon: XCircle, label: "Failed" },
};

export default function Goals() {
  const { data: goals, isLoading } = useListGoals();
  const createGoal = useCreateGoal();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ title: string; description: string; industry: string }>();

  const onSubmit = (data: { title: string; description: string; industry: string }) => {
    createGoal.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Goals</h1>
          <p className="text-muted-foreground mt-1">Deploy goals to your autonomous AI workforce.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-goal">
              <Plus className="h-4 w-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Deploy New Business Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input id="title" placeholder="e.g. Launch product in APAC market" data-testid="input-goal-title"
                  {...register("title", { required: true })} className={errors.title ? "border-destructive" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the business objective in detail..." data-testid="input-goal-description"
                  rows={4} {...register("description", { required: true })} className={errors.description ? "border-destructive" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry (optional)</Label>
                <Input id="industry" placeholder="e.g. SaaS, E-commerce, FinTech" data-testid="input-goal-industry"
                  {...register("industry")} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={createGoal.isPending} data-testid="button-submit-goal">
                {createGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {createGoal.isPending ? "Deploying to AI Workforce..." : "Deploy Goal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : goals?.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-20 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No goals deployed yet. Create your first business goal to activate the AI workforce.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals?.map((goal, i) => {
            const status = STATUS_CONFIG[goal.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={`/goals/${goal.id}`} className="block group" data-testid={`card-goal-${goal.id}`}>
                  <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(100,50,255,0.2)] cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                          {goal.title}
                        </CardTitle>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <Badge variant="outline" className={`text-xs w-fit border ${status.bg} ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground font-mono">
                        {goal.industry && <span className="px-2 py-0.5 rounded bg-muted/50">{goal.industry}</span>}
                        <span className="ml-auto">{formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
