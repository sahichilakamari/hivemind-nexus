import { useGetAgentNetwork } from "@workspace/api-client-react";
import { Loader2, Network as NetworkIcon, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Network() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: networkData, isLoading } = useGetAgentNetwork({
    query: { queryKey: ["network"] }
  });

  useEffect(() => {
    if (!canvasRef.current || !networkData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A very simple force-directed graph simulation could go here
    // For visual impact, we'll draw a static but animated aesthetic representation
    
    let animationFrameId: number;
    let time = 0;

    const render = () => {
      // Resize to container
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.7;

      // Position nodes in a circle
      const nodes = networkData.nodes;
      const edges = networkData.edges;
      
      const nodePositions = new Map<string, {x: number, y: number}>();
      
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 + (time * 0.001);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        nodePositions.set(node.id, { x, y });
      });

      // Draw edges
      edges.forEach(edge => {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);
        
        if (sourcePos && targetPos) {
          ctx.beginPath();
          ctx.moveTo(sourcePos.x, sourcePos.y);
          
          // Curve it slightly towards center
          const ctrlX = cx;
          const ctrlY = cy;
          
          ctx.quadraticCurveTo(ctrlX, ctrlY, targetPos.x, targetPos.y);
          
          // Glow effect for active edges
          if (edge.active) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + Math.sin(time * 0.05) * 0.2})`;
            ctx.lineWidth = edge.weight * 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
          } else {
            ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.lineWidth = edge.weight;
            ctx.shadowBlur = 0;
          }
          
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = nodePositions.get(node.id);
        if (!pos) return;

        // Node pulse
        const isWorking = node.status === 'working';
        const nodeRadius = 20 + (isWorking ? Math.sin(time * 0.1) * 2 : 0);

        ctx.shadowBlur = isWorking ? 20 : 10;
        ctx.shadowColor = isWorking ? 'rgba(0, 255, 255, 1)' : 'rgba(180, 0, 255, 0.5)';
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 15, 30, 1)';
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = isWorking ? 'rgba(0, 255, 255, 0.8)' : 'rgba(180, 0, 255, 0.8)';
        ctx.stroke();

        // Node label
        ctx.shadowBlur = 0;
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.toUpperCase(), pos.x, pos.y + nodeRadius + 15);
      });

      time++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [networkData]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-glow mb-1">Neural Network</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Agent Communication Topology</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded border-primary/30 flex items-center gap-2">
           <Zap className="w-4 h-4 text-primary animate-pulse" />
           <span className="font-mono text-xs uppercase tracking-widest text-primary">Synaptic Links Active</span>
        </div>
      </div>

      <div className="flex-1 glass-panel-heavy border-primary/20 rounded-lg relative overflow-hidden min-h-[500px]">
        <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Topological View
        </div>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
