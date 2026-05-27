import { useGetMeeting, useListMeetingMessages } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Loader2, Mic, Eye, BrainCircuit, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function MeetingDetails() {
  const { id } = useParams();
  const meetingId = parseInt(id || "0", 10);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: meeting, isLoading: isLoadingMeeting } = useGetMeeting(meetingId);
  const { data: messages, isLoading: isLoadingMessages } = useListMeetingMessages(meetingId, {
    query: { refetchInterval: 2000 }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoadingMeeting) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  // Extract unique agents in this meeting for the "video grid"
  const participants = Array.from(new Set(messages?.map(m => m.agentName))).filter(Boolean);

  return (
    <div className="h-full flex flex-col space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.3)] rounded-full" />
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-white">{meeting?.title}</h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Session ID: MTG-{meeting?.id} • <span className={meeting?.status === 'active' ? 'text-red-500 animate-pulse' : 'text-primary'}>{meeting?.status}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Main View - Virtual Room */}
        <Card className="col-span-1 lg:col-span-3 glass-panel-heavy border-amber-400/20 flex flex-col h-full overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
          <CardHeader className="py-3 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm uppercase tracking-widest text-amber-400 flex items-center gap-2 text-glow">
              <Eye className="w-4 h-4" /> Live Transcript
            </CardTitle>
            <div className="flex gap-2">
               {participants.map((p, i) => (
                 <div key={i} className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-[9px] font-mono text-amber-400 uppercase">
                   {p}
                 </div>
               ))}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-black/20">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages?.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col max-w-[85%]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80 font-bold">
                        {msg.agentName} {msg.agentRole ? `[${msg.agentRole}]` : ''}
                      </span>
                      {msg.isDecision && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1 py-0 h-4">DECISION</Badge>
                      )}
                    </div>
                    <div className={`p-4 rounded border font-mono text-sm leading-relaxed 
                      ${msg.isDecision ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-100 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/10 bg-white/5 text-foreground'}`}>
                      "{msg.content}"
                    </div>
                    {msg.confidence && (
                      <div className="text-[9px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-primary/50" /> CONFIDENCE INDEX: {msg.confidence}%
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoadingMessages && (
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs py-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing audio streams...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Sidebar - Intel */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="glass-panel border-white/10 shrink-0">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Meeting Agenda</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">{meeting?.agenda || "Open discussion."}</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-emerald-500/30 flex-1 overflow-hidden flex flex-col">
            <CardHeader className="py-3 border-b border-white/5 shrink-0">
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-emerald-400 flex items-center gap-2 text-glow">
                <BrainCircuit className="w-4 h-4" /> Key Decisions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {messages?.filter(m => m.isDecision).map((dec, i) => (
                    <motion.div
                      key={dec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded"
                    >
                      <p className="text-xs font-mono text-emerald-100 leading-relaxed">
                        {dec.content}
                      </p>
                      <div className="mt-2 text-[9px] font-mono text-emerald-500/70 uppercase">
                        Ratified by: {dec.agentName}
                      </div>
                    </motion.div>
                  ))}
                  {(!messages || messages.filter(m => m.isDecision).length === 0) && (
                    <div className="text-center py-10">
                      <BrainCircuit className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No resolutions reached</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
