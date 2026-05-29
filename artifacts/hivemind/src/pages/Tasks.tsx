import { useState } from "react";
import { motion } from "framer-motion";
import { useListTasks, useCreateTask, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, Loader2, AlertCircle, ArrowUp, Minus, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";

const STATUSES = ["pending", "in_progress", "completed", "blocked", "failed"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", in_progress: "In Progress", completed: "Completed", blocked: "Blocked", failed: "Failed"
};
const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground border-border bg-muted/30",
  in_progress: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  completed: "text-chart-3 border-chart-3/30 bg-chart-3/10",
  blocked: "text-chart-5 border-chart-5/30 bg-chart-5/10",
  failed: "text-destructive border-destructive/30 bg-destructive/10",
};
const PRIORITY_ICONS: Record<string, typeof Minus> = {
  low: Minus, medium: Flag, high: ArrowUp, critical: AlertCircle,
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-chart-5", high: "text-chart-2", critical: "text-destructive",
};

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<{
    title: string; description: string; priority: string;
  }>({ defaultValues: { priority: "medium" } });

  const onSubmit = (data: { title: string; description: string; priority: string }) => {
    createTask.mutate({ data: { title: data.title, description: data.description, priority: data.priority as "low" | "medium" | "high" | "critical" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setOpen(false);
        reset();
      }
    });
  };

  const handleStatusChange = (taskId: number, status: string) => {
    updateTask.mutate({ id: taskId, data: { status: status as "pending" | "in_progress" | "completed" | "blocked" | "failed" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const columns = STATUSES.map(status => ({
    status,
    tasks: (tasks || []).filter(t => t.status === status),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Force</h1>
          <p className="text-muted-foreground mt-1">Track all AI agent tasks across the workforce.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-task">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Task title" data-testid="input-task-title"
                  {...register("title", { required: true })} className={errors.title ? "border-destructive" : ""} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Task description" rows={3} data-testid="input-task-description" {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Controller name="priority" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger data-testid="select-task-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={createTask.isPending} data-testid="button-submit-task">
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUSES.map(s => <div key={s} className="h-64 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {columns.map(({ status, tasks: colTasks }) => {
            const colorClass = STATUS_COLORS[status];
            return (
              <div key={status} className="min-w-[200px]" data-testid={`column-${status}`}>
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${colorClass}`}>
                  <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
                  <Badge variant="outline" className={`ml-auto text-xs ${colorClass}`}>{colTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task, i) => {
                    const PrioIcon = PRIORITY_ICONS[task.priority] || Flag;
                    const prioColor = PRIORITY_COLORS[task.priority] || "text-muted-foreground";
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-200 cursor-pointer" data-testid={`task-card-${task.id}`}>
                          <CardContent className="p-3">
                            <p className="text-xs font-medium leading-tight">{task.title}</p>
                            {task.assignedAgentName && (
                              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{task.assignedAgentName}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <PrioIcon className={`h-3 w-3 ${prioColor}`} />
                              <Select onValueChange={(v) => handleStatusChange(task.id, v)} defaultValue={task.status}>
                                <SelectTrigger className="h-5 text-[10px] px-1.5 w-auto border-none bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="h-20 rounded-lg border border-dashed border-border/50 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
