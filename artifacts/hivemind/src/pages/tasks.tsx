import { useListTasks, useCreateTask, useUpdateTask, useListAgents, getListTasksQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Plus, AlertCircle, Clock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Tasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Need to provide a valid priority type to match TaskInputPriority
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    priority: "medium" as "low" | "medium" | "high" | "critical",
    assignedAgentId: "" 
  });

  const { data: tasks, isLoading: isLoadingTasks } = useListTasks({
    query: { queryKey: ["tasks"] }
  });

  const { data: agents } = useListAgents({
    query: { queryKey: ["agents"] }
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setIsDialogOpen(false);
        setFormData({ title: "", description: "", priority: "medium", assignedAgentId: "" });
        toast({ title: "Task Deployed", description: "Agent notified of new objective." });
      }
    }
  });

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createTask.mutate({ 
      data: {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignedAgentId: formData.assignedAgentId ? parseInt(formData.assignedAgentId) : undefined
      } 
    });
  };

  const handleStatusChange = (taskId: number, newStatus: "pending" | "in_progress" | "completed" | "blocked" | "failed") => {
    updateTask.mutate({ id: taskId, data: { status: newStatus } });
  };

  if (isLoadingTasks) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  const columns = [
    { id: 'pending', title: 'Pending', icon: Clock, color: 'text-muted-foreground' },
    { id: 'in_progress', title: 'In Progress', icon: Loader2, color: 'text-primary' },
    { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'text-destructive border-destructive/30';
      case 'high': return 'text-amber-400 border-amber-400/30';
      case 'medium': return 'text-primary border-primary/30';
      default: return 'text-muted-foreground border-white/10';
    }
  };

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Task Force</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Operational Grid</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)] uppercase font-bold tracking-widest" data-testid="button-create-task">
              <Plus className="w-4 h-4 mr-2" /> Assign Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-heavy border-primary/30 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-primary text-glow flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> New Operational Task
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Task Title</label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Details</label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-black/50 border-white/10 font-mono min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Priority</label>
                  <Select value={formData.priority} onValueChange={(val: any) => setFormData({...formData, priority: val})}>
                    <SelectTrigger className="bg-black/50 border-white/10 font-mono">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 font-mono">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Assign Agent</label>
                  <Select value={formData.assignedAgentId} onValueChange={(val) => setFormData({...formData, assignedAgentId: val})}>
                    <SelectTrigger className="bg-black/50 border-white/10 font-mono">
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 font-mono">
                      <SelectItem value="0">Auto-assign (AI chooses)</SelectItem>
                      {agents?.map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name} [{a.role}]</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={createTask.isPending} className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest mt-4">
                {createTask.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Deploy
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {columns.map(col => {
          const columnTasks = tasks?.filter(t => t.status === col.id) || [];
          const Icon = col.icon;
          
          return (
            <div key={col.id} className="flex flex-col h-full bg-white/[0.02] rounded-lg border border-white/5 p-4 relative">
              {col.id === 'in_progress' && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-lg pointer-events-none"></div>
              )}
              <div className="flex items-center justify-between mb-4 shrink-0 border-b border-white/10 pb-3">
                <h3 className={`font-display uppercase tracking-widest font-bold flex items-center gap-2 ${col.color}`}>
                  <Icon className={`w-4 h-4 ${col.id === 'in_progress' ? 'animate-spin' : ''}`} />
                  {col.title}
                </h3>
                <Badge variant="outline" className="font-mono text-[10px] bg-black/50 border-white/10">
                  {columnTasks.length}
                </Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {columnTasks.map(task => (
                  <motion.div 
                    layoutId={`task-${task.id}`}
                    key={task.id}
                    className="glass-panel p-4 rounded border border-white/10 hover:border-primary/40 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={`font-mono text-[9px] uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">ID: NX-{task.id}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-2 leading-tight">{task.title}</h4>
                    {task.assignedAgentName && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-primary bg-primary/10 w-fit px-2 py-1 rounded">
                        <Briefcase className="w-3 h-3" /> {task.assignedAgentName}
                      </div>
                    )}
                    
                    {/* Interaction Actions */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.id === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full h-7 text-[10px] uppercase font-mono tracking-widest border-primary/30 text-primary hover:bg-primary/20" onClick={() => handleStatusChange(task.id, 'in_progress')}>
                          Start <ArrowRight className="w-3 h-3 ml-1"/>
                        </Button>
                      )}
                      {col.id === 'in_progress' && (
                        <Button size="sm" variant="outline" className="w-full h-7 text-[10px] uppercase font-mono tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" onClick={() => handleStatusChange(task.id, 'completed')}>
                          Complete <CheckCircle2 className="w-3 h-3 ml-1"/>
                        </Button>
                      )}
                      {col.id !== 'pending' && col.id !== 'in_progress' && (
                        <Button size="sm" variant="outline" className="w-full h-7 text-[10px] uppercase font-mono tracking-widest border-white/20 text-muted-foreground" disabled>
                          Archived
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground font-mono text-xs uppercase tracking-widest opacity-50">
                    Sector Clear
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
