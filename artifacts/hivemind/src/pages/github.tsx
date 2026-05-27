import { useListGithubLogs, usePushToGithub, getListGithubLogsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Github as GithubIcon, GitCommit, GitPullRequest, GitMerge, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Github() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commitMsg, setCommitMsg] = useState("");

  const { data: logs, isLoading } = useListGithubLogs({
    query: { queryKey: ["github"] }
  });

  const pushToGithub = usePushToGithub({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGithubLogsQueryKey() });
        setCommitMsg("");
        toast({ title: "Code Pushed", description: "Changes synchronized with remote repository." });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg) return;
    pushToGithub.mutate({ data: { commitMessage: commitMsg } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400';
      case 'pending': return 'text-amber-400 animate-pulse';
      case 'failed': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">GitHub Sync</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Version Control Integration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Sync Controls */}
        <Card className="col-span-1 glass-panel border-white/10 shrink-0 h-fit">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-widest text-primary flex items-center gap-2">
              <GitPullRequest className="w-4 h-4" /> Trigger Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Commit Message</label>
                <Input 
                  value={commitMsg}
                  onChange={e => setCommitMsg(e.target.value)}
                  placeholder="e.g. feat: AI integrated payment gateway"
                  className="bg-black/50 border-white/10 font-mono focus-visible:ring-primary"
                  required
                />
              </div>
              <Button type="submit" disabled={pushToGithub.isPending} className="w-full bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-widest shadow-[var(--shadow-glow)]">
                {pushToGithub.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GithubIcon className="w-4 h-4 mr-2" />}
                Push to Origin
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono text-muted-foreground uppercase">
                <span>Repository</span>
                <span className="text-white flex items-center gap-1">hivemind/core-sys <ExternalLink className="w-3 h-3"/></span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-muted-foreground uppercase">
                <span>Branch</span>
                <span className="text-primary flex items-center gap-1"><GitBranch className="w-3 h-3"/> main</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card className="col-span-1 lg:col-span-2 glass-panel-heavy border-primary/20 flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-white/5 py-4 shrink-0">
            <CardTitle className="font-mono text-sm uppercase tracking-widest text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-primary" /> Sync History Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {logs?.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded group hover:border-primary/30 transition-colors relative"
                  >
                    <div className="mt-1 shrink-0">
                      <GitMerge className={`w-5 h-5 ${getStatusColor(log.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-mono text-sm text-white font-bold truncate">{log.commitMessage}</p>
                        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-current ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase">
                        {log.commitHash && (
                          <span className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3" /> {log.commitHash.substring(0,7)}
                          </span>
                        )}
                        {log.filesChanged && (
                          <span>{log.filesChanged} files changed</span>
                        )}
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!logs || logs.length === 0) && (
                  <div className="text-center py-20">
                    <GithubIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">No sync history</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Simple icon missing from lucide-react import
function GitBranch(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}
