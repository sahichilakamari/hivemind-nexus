import { useState } from "react";
import { motion } from "framer-motion";
import { useListGithubLogs, usePushToGithub, getListGithubLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Github, Upload, Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending: { color: "text-chart-5", icon: Clock },
  success: { color: "text-chart-3", icon: CheckCircle2 },
  failed: { color: "text-destructive", icon: XCircle },
};

export default function GithubSync() {
  const { data: logs, isLoading } = useListGithubLogs();
  const pushToGithub = usePushToGithub();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ commitMessage: string }>();

  const onSubmit = (data: { commitMessage: string }) => {
    pushToGithub.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGithubLogsQueryKey() });
        reset();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GitHub Sync</h1>
        <p className="text-muted-foreground mt-1">Push AI-generated reports and assets to GitHub.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" />
              Push to GitHub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Commit Message</Label>
                <Input placeholder="e.g. Update AI reports and assets" data-testid="input-commit-message"
                  {...register("commitMessage", { required: true })}
                  className={errors.commitMessage ? "border-destructive" : ""} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={pushToGithub.isPending} data-testid="button-push-github">
                {pushToGithub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                {pushToGithub.isPending ? "Pushing..." : "Push to GitHub"}
              </Button>
            </form>
            <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-white/5 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">About GitHub Sync</p>
              <p>Pushes AI-generated reports, meeting transcripts, and business assets directly to your GitHub repository.</p>
              <p className="font-mono text-chart-1">Requires GITHUB_PAT environment variable.</p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Sync History</h2>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : logs?.length === 0 ? (
            <Card className="glass-card border-white/10">
              <CardContent className="py-16 text-center">
                <Github className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">No sync history yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...(logs || [])].reverse().map((log, i) => {
                const status = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card className="glass-card border-white/10" data-testid={`github-log-${log.id}`}>
                      <CardContent className="flex items-center gap-4 py-4 px-5">
                        <StatusIcon className={`h-5 w-5 flex-shrink-0 ${status.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{log.commitMessage}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {log.commitHash && (
                              <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{log.commitHash}</span>
                            )}
                            {log.filesChanged != null && (
                              <span className="text-xs text-muted-foreground">{log.filesChanged} file{log.filesChanged !== 1 ? "s" : ""}</span>
                            )}
                            <span className="text-xs text-muted-foreground font-mono ml-auto">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs border ${
                            log.status === "success" ? "border-chart-3/30 bg-chart-3/10 text-chart-3" :
                            log.status === "failed" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                            "border-chart-5/30 bg-chart-5/10 text-chart-5"
                          }`}>
                            {log.status.toUpperCase()}
                          </Badge>
                          {log.repoUrl && (
                            <a href={log.repoUrl} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-repo-${log.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
