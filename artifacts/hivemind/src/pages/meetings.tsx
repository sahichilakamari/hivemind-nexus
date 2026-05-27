import { useListMeetings, useCreateMeeting, getListMeetingsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Video, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Meetings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", agenda: "" });

  const { data: meetings, isLoading } = useListMeetings({
    query: { queryKey: ["meetings"] }
  });

  const createMeeting = useCreateMeeting({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
        setIsDialogOpen(false);
        setFormData({ title: "", agenda: "" });
        toast({ title: "Meeting Scheduled", description: "Agents are joining the room." });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createMeeting.mutate({ data: formData });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Board Meetings</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">AI Executive Briefings</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)] uppercase font-bold tracking-widest" data-testid="button-create-meeting">
              <Plus className="w-4 h-4 mr-2" /> Convene Board
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel-heavy border-primary/30 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-primary text-glow flex items-center gap-2">
                <Users className="w-5 h-5" /> Initialize Session
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Session Topic</label>
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Q4 Budget Allocation"
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Agenda (Optional)</label>
                <Textarea 
                  value={formData.agenda}
                  onChange={e => setFormData({...formData, agenda: e.target.value})}
                  placeholder="Items to discuss..."
                  className="bg-black/50 border-white/10 font-mono min-h-[100px] focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <Button type="submit" disabled={createMeeting.isPending} className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest mt-4">
                {createMeeting.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                Start Broadcast
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings?.map((meeting, i) => (
          <motion.div
            key={meeting.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-white/10 hover:border-primary/40 transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
              {meeting.status === 'active' && (
                <div className="absolute top-0 right-0 p-1 px-3 bg-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2 border-b border-l border-red-500/30 rounded-bl">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-white tracking-wide">{meeting.title}</CardTitle>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> {new Date(meeting.createdAt).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground font-mono mb-6 line-clamp-3">{meeting.agenda || "No agenda provided."}</p>
                <div className="mt-auto">
                  <Link href={`/meetings/${meeting.id}`}>
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 uppercase font-mono tracking-widest text-xs group-hover:shadow-[var(--shadow-glow)]">
                      Join Room <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
