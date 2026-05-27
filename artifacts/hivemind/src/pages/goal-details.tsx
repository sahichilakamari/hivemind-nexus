import { useGetGoal, useListGoalMessages, useSendGoalMessage, useListGoalAssets, getListGoalMessagesQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Terminal, Loader2, Send, ShieldAlert, CheckCircle2, HandHeart, FileCode2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

export default function GoalDetails() {
  const { id } = useParams();
  const goalId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");

  const { data: goal, isLoading: isLoadingGoal } = useGetGoal(goalId);
  const { data: messages, isLoading: isLoadingMessages } = useListGoalMessages(goalId, {
    query: { refetchInterval: 2000 } // Poll every 2s for live feel
  });
  const { data: assets } = useListGoalAssets(goalId);

  const sendMessage = useSendGoalMessage({
    mutation: {
      onSuccess: () => {
        setPrompt("");
        queryClient.invalidateQueries({ queryKey: getListGoalMessagesQueryKey(goalId) });
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    sendMessage.mutate({ id: goalId, data: { content: prompt } });
  };

  const getMessageIcon = (type: string) => {
    switch(type) {
      case 'disagreement': return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case 'approval': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'task_handoff': return <HandHeart className="w-4 h-4 text-amber-400" />;
      case 'user': return <Terminal className="w-4 h-4 text-primary" />;
      default: return <Bot className="w-4 h-4 text-secondary" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch(type) {
      case 'disagreement': return 'border-destructive/30 bg-destructive/5 text-destructive-foreground';
      case 'approval': return 'border-emerald-400/30 bg-emerald-400/5 text-emerald-400';
      case 'task_handoff': return 'border-amber-400/30 bg-amber-400/5 text-amber-400';
      case 'user': return 'border-primary/30 bg-primary/10 text-primary-foreground';
      default: return 'border-white/10 bg-white/5 text-foreground';
    }
  };

  if (isLoadingGoal) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-full flex flex-col space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <Target className="w-8 h-8 text-primary animate-pulse shadow-[var(--shadow-glow)] rounded-full" />
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-white">{goal?.title}</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Directive ID: NX-{goal?.id} • Status: <span className="text-primary">{goal?.status}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Live Terminal */}
        <Card className="col-span-1 lg:col-span-2 glass-panel-heavy border-primary/20 flex flex-col h-full overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 bg-primary/10 border-b border-l border-primary/30 rounded-bl text-[10px] font-mono text-primary flex items-center gap-2 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Live Stream
          </div>
          <CardHeader className="py-3 border-b border-white/5">
            <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Neural Comm Link
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.messageType === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col max-w-[85%] ${msg.messageType === 'user' ? 'ml-auto' : 'mr-auto'}`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${msg.messageType === 'user' ? 'justify-end' : ''}`}>
                      {msg.messageType !== 'user' && getMessageIcon(msg.messageType)}
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {msg.agentName} {msg.agentRole ? `[${msg.agentRole}]` : ''}
                      </span>
                      {msg.messageType === 'user' && getMessageIcon(msg.messageType)}
                    </div>
                    <div className={`p-3 rounded-lg border font-mono text-sm leading-relaxed ${getMessageColor(msg.messageType)}`}>
                      {msg.content}
                    </div>
                    {msg.confidence && (
                      <div className="text-[9px] font-mono text-muted-foreground mt-1 flex justify-end">
                        CONF: {msg.confidence}%
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoadingMessages && (
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" /> Intercepting signals...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 bg-black/40">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Inject directive into stream..."
                  className="bg-black/50 border-white/20 font-mono text-sm focus-visible:ring-primary"
                />
                <Button type="submit" disabled={sendMessage.isPending || !prompt.trim()} className="bg-primary text-black uppercase font-bold tracking-widest shrink-0">
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar - Assets */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="glass-panel border-white/10 shrink-0">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-foreground/80 leading-relaxed font-mono">{goal?.description}</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-secondary/30 flex-1 overflow-hidden flex flex-col relative">
             <div className="absolute top-0 right-0 p-2 bg-secondary/10 border-b border-l border-secondary/30 rounded-bl text-[10px] font-mono text-secondary tracking-widest uppercase">
              Artifacts
            </div>
            <CardHeader className="py-3 border-b border-white/5 shrink-0">
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-secondary flex items-center gap-2 text-glow-purple">
                <FileCode2 className="w-4 h-4" /> Synthesized Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {assets?.map((asset, i) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-white/5 border border-white/10 rounded group hover:border-secondary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-display font-bold uppercase tracking-wider text-sm text-white group-hover:text-secondary transition-colors">{asset.title}</h4>
                          <Badge variant="outline" className="text-[9px] font-mono uppercase border-secondary/30 text-secondary bg-secondary/10">
                            {asset.assetType}
                          </Badge>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground line-clamp-3 leading-relaxed">
                          {asset.content}
                        </p>
                        <div className="mt-2 text-[9px] font-mono text-muted-foreground uppercase text-right">
                          By: {asset.generatedBy || 'SYSTEM'}
                        </div>
                      </motion.div>
                    ))}
                    {(!assets || assets.length === 0) && (
                      <div className="text-center py-10">
                        <FileCode2 className="w-8 h-8 text-secondary/30 mx-auto mb-2" />
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No assets synthesized yet</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
