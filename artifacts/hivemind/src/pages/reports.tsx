import { useListReports } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const { data: reports, isLoading } = useListReports({
    query: { queryKey: ["reports"] }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Intelligence Reports</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Synthesized Output Archives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports?.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-panel border-white/10 hover:border-primary/40 transition-all duration-300 h-full flex flex-col group">
              <CardHeader className="pb-3 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl -z-10 group-hover:bg-primary/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-primary/30 text-primary bg-primary/5">
                    {report.reportType || 'GENERAL_INTEL'}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="text-lg font-bold text-white tracking-wide leading-tight">{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-5 flex flex-col">
                <div className="text-xs font-mono text-muted-foreground mb-4 line-clamp-4 leading-relaxed bg-black/20 p-3 rounded border border-white/5 flex-1">
                  {report.content}
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                    <span className="text-primary">Author:</span> {report.generatedBy || 'SYSTEM'}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10 px-2 group-hover:shadow-[var(--shadow-glow)]">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {(!reports || reports.length === 0) && (
          <div className="col-span-full py-20 text-center glass-panel rounded-lg">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-display uppercase tracking-widest text-lg text-white mb-2">No Reports Available</h3>
            <p className="text-muted-foreground font-mono text-sm">Agents have not finalized any major documents.</p>
          </div>
        )}
      </div>
    </div>
  );
}
