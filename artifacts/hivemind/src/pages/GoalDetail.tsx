import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetGoal, useListGoalMessages, useSendGoalMessage,
  useListGoalAssets, getListGoalMessagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare, Loader2, FileText, Zap, HelpCircle, ThumbsUp, AlertTriangle, ArrowRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const MSG_TYPE_CONFIG = {
  statement: { icon: MessageSquare, color: "text-chart-1", bg: "bg-chart-1/10" },
  question: { icon: HelpCircle, color: "text-chart-5", bg: "bg-chart-5/10" },
  disagreement: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  approval: { icon: ThumbsUp, color: "text-chart-3", bg: "bg-chart-3/10" },
  task_handoff: { icon: ArrowRight, color: "text-chart-4", bg: "bg-chart-4/10" },
  user: { icon: User, color: "text-chart-2", bg: "bg-chart-2/10" },
};

export default function GoalDetail() {
  const [, params] = useRoute("/goals/:id");
  const id = parseInt(params?.id || "0");
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: goal } = useGetGoal(id, { query: { enabled: !!id, queryKey: ["getGoal", id] as unknown as readonly unknown[] } });
  const { data: messages } = useListGoalMessages(id, {
    query: {
      enabled: !!id,
      queryKey: getListGoalMessagesQueryKey(id),
      refetchInterval: 3000,
    }
  });
  const { data: assets } = useListGoalAssets(id, { query: { enabled: !!id, queryKey: ["listGoalAssets", id] as unknown as readonly unknown[] } });
  const sendMessage = useSendGoalMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({ id, data: { content: message } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalMessagesQueryKey(id) });
        setMessage("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/goals" className="p-2 rounded-md hover:bg-muted/50 transition-colors" data-testid="link-back-goals">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{goal?.title || "Loading..."}</h1>
          {goal?.industry && <p className="text-muted-foreground text-sm mt-0.5">{goal.industry}</p>}
        </div>
        {goal && (
          <Badge variant="outline" className={`text-xs border ${
            goal.status === "active" ? "text-chart-3 border-chart-3/30 bg-chart-3/10" :
            goal.status === "completed" ? "text-chart-1 border-chart-1/30 bg-chart-1/10" : 
            "text-muted-foreground border-border"
          }`}>
            {goal.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {goal?.description && (
        <Card className="glass-card border-white/10">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" />
                Live Agent Collaboration
                <span className="ml-auto flex items-center gap-1.5 text-xs text-chart-3 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-3 animate-pulse" />
                  LIVE
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px] px-4" ref={scrollRef as unknown as React.RefObject<HTMLDivElement>}>
                <div className="space-y-3 py-4">
                  <AnimatePresence>
                    {messages?.map((msg, i) => {
                      const typeConf = MSG_TYPE_CONFIG[msg.messageType as keyof typeof MSG_TYPE_CONFIG] || MSG_TYPE_CONFIG.statement;
                      const TypeIcon = typeConf.icon;
                      const isUser = msg.messageType === "user";
                      return (
                        <motion.div key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.3) }}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                          data-testid={`msg-${msg.id}`}
                        >
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${typeConf.bg} ${isUser ? "border-chart-2/30" : "border-white/10"}`}>
                            <TypeIcon className={`h-3.5 w-3.5 ${typeConf.color}`} />
                          </div>
                          <div className={`flex-1 max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${typeConf.color}`}>{msg.agentName}</span>
                              <span className="text-xs text-muted-foreground font-mono">{msg.agentRole}</span>
                              {msg.confidence && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {Math.round(msg.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed border ${typeConf.bg} border-white/5`}>
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {!messages?.length && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-8 w-8 mx-auto mb-3 opacity-30 animate-pulse" />
                      <p className="text-sm">Agents are preparing to collaborate...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border/50 flex gap-2">
                <Input
                  placeholder="Inject a message into the agent conversation..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  className="bg-muted/50"
                  data-testid="input-message"
                />
                <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || !message.trim()} data-testid="button-send">
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-secondary" />
                Generated Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {assets?.map(asset => (
                    <div key={asset.id} className="p-3 rounded-md bg-muted/30 border border-white/5 hover:border-secondary/30 transition-colors" data-testid={`asset-${asset.id}`}>
                      <p className="text-xs font-semibold text-secondary">{asset.assetType}</p>
                      <p className="text-sm mt-0.5">{asset.title}</p>
                    </div>
                  ))}
                  {!assets?.length && (
                    <p className="text-sm text-muted-foreground text-center py-8">Assets will appear as agents work</p>
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
