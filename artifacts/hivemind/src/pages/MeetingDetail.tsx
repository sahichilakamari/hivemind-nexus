import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMeeting, useListMeetingMessages, getListMeetingMessagesQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Mic, Star, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  CEO: "text-chart-1",
  CFO: "text-chart-3",
  CTO: "text-chart-4",
  CMO: "text-chart-2",
  COO: "text-chart-5",
  CLO: "text-chart-1",
  CHRO: "text-chart-2",
  CIO: "text-chart-3",
};

export default function MeetingDetail() {
  const [, params] = useRoute("/meetings/:id");
  const id = parseInt(params?.id || "0");

  const { data: meeting, isLoading: meetingLoading } = useGetMeeting(id, {
    query: { enabled: !!id, queryKey: ["getMeeting", id] as unknown as readonly unknown[] }
  });
  const { data: messages, isLoading: msgLoading } = useListMeetingMessages(id, {
    query: {
      enabled: !!id,
      queryKey: getListMeetingMessagesQueryKey(id),
      refetchInterval: meeting?.status === "active" ? 3000 : false,
    }
  });

  if (meetingLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/meetings" className="p-2 rounded-md hover:bg-muted/50 transition-colors" data-testid="link-back-meetings">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{meeting?.title}</h1>
          {meeting?.agenda && <p className="text-sm text-muted-foreground mt-0.5">{meeting.agenda}</p>}
        </div>
        {meeting && (
          <Badge variant="outline" className={`text-xs border ${
            meeting.status === "active" ? "text-chart-3 border-chart-3/30 bg-chart-3/10" :
            meeting.status === "completed" ? "text-chart-1 border-chart-1/30 bg-chart-1/10" :
            "text-muted-foreground border-border"
          }`}>
            {meeting.status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-chart-3 animate-pulse mr-1.5 inline-block" />}
            {meeting.status.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 glass-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4 text-primary" />
              Board Discussion Transcript
              {msgLoading && <Loader2 className="h-3 w-3 animate-spin ml-2 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] px-4">
              <div className="space-y-4 py-4">
                <AnimatePresence>
                  {messages?.map((msg, i) => {
                    const roleColor = ROLE_COLORS[msg.agentRole] || "text-chart-1";
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.5) }}
                        className={`flex gap-3 ${msg.isDecision ? "p-3 rounded-lg border border-chart-1/30 bg-chart-1/5" : ""}`}
                        data-testid={`meeting-msg-${msg.id}`}
                      >
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-white/10 ${roleColor}`}>
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${roleColor}`}>{msg.agentName}</span>
                            <span className="text-xs text-muted-foreground font-mono">{msg.agentRole}</span>
                            {msg.confidence && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {Math.round(msg.confidence * 100)}% conf
                              </span>
                            )}
                            {msg.isDecision && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-chart-1 border-chart-1/30 bg-chart-1/10 ml-auto">
                                <Star className="h-2.5 w-2.5 mr-1" /> DECISION
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1 text-foreground/90 leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!messages?.length && !msgLoading && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Mic className="h-10 w-10 mx-auto mb-3 opacity-30 animate-pulse" />
                    <p className="text-sm">Board is convening...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Meeting Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-mono capitalize">{meeting?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-mono">{messages?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decisions</span>
                <span className="font-mono text-chart-1">{messages?.filter(m => m.isDecision).length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="font-mono text-xs">
                  {meeting ? formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true }) : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
