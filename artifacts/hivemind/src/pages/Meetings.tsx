import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListMeetings, useCreateMeeting, getListMeetingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, ChevronRight, Loader2, Mic, CheckCircle2, Calendar } from "lucide-react";
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
  scheduled: { color: "text-chart-5", bg: "bg-chart-5/10 border-chart-5/30", icon: Calendar },
  active: { color: "text-chart-3", bg: "bg-chart-3/10 border-chart-3/30", icon: Mic },
  completed: { color: "text-chart-1", bg: "bg-chart-1/10 border-chart-1/30", icon: CheckCircle2 },
};

export default function Meetings() {
  const { data: meetings, isLoading } = useListMeetings();
  const createMeeting = useCreateMeeting();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ title: string; agenda: string }>();

  const onSubmit = (data: { title: string; agenda: string }) => {
    createMeeting.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMeetingsQueryKey() });
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Board Meetings</h1>
          <p className="text-muted-foreground mt-1">Convene your AI C-suite for real-time strategy sessions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-meeting">
              <Plus className="h-4 w-4" /> New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Convene Board Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Meeting Title</Label>
                <Input placeholder="e.g. Q2 Strategy Review" data-testid="input-meeting-title"
                  {...register("title", { required: true })} className={errors.title ? "border-destructive" : ""} />
              </div>
              <div className="space-y-2">
                <Label>Agenda (optional)</Label>
                <Textarea placeholder="What should the board discuss?" data-testid="input-meeting-agenda"
                  rows={3} {...register("agenda")} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={createMeeting.isPending} data-testid="button-submit-meeting">
                {createMeeting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {createMeeting.isPending ? "Calling board to order..." : "Convene Meeting"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : meetings?.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No meetings scheduled. Convene your first board meeting.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings?.map((meeting, i) => {
            const status = STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled;
            const StatusIcon = status.icon;
            return (
              <motion.div key={meeting.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={`/meetings/${meeting.id}`} className="block group" data-testid={`card-meeting-${meeting.id}`}>
                  <Card className="glass-card border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(100,50,255,0.15)] cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${status.bg} border`}>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">{meeting.title}</p>
                          {meeting.agenda && <p className="text-sm text-muted-foreground mt-0.5 max-w-md truncate">{meeting.agenda}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className={`text-xs border ${status.bg} ${status.color}`}>
                            {meeting.status.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
