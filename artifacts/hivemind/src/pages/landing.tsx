import { Link } from "wouter";
import { motion } from "framer-motion";
import { Network, BrainCircuit, Activity, Zap, Cpu, Users, ChevronRight } from "lucide-react";
import heroImage from "@assets/hero-bg.png"; // Assuming generate_image saved to public/hero-bg.png and Vite serves it, or we use a direct import

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col selection:bg-primary/30">
      <div className="scanline-effect absolute inset-0 pointer-events-none z-50"></div>
      
      {/* Header */}
      <header className="absolute top-0 w-full p-6 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary border-glow">
            <Network className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-widest text-glow text-primary">NEXUS</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <button className="px-6 py-2 rounded border border-primary/50 text-primary uppercase font-mono tracking-widest text-sm hover:bg-primary/10 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              Initialize
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10">
        <div className="absolute inset-0 z-0">
           {/* Direct image use since it's generated to public folder */}
           <img src="/hero-bg.png" alt="Hero Background" className="w-full h-full object-cover opacity-30 object-center" />
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[var(--shadow-glow-purple)]"></span>
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">System Online • v0.9.1.beta</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 tracking-tight leading-tight"
          >
            THE WORLD'S FIRST <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient text-glow">
              AUTONOMOUS AI WORKFORCE
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-mono tracking-wide leading-relaxed"
          >
            Deploy a complete C-suite of autonomous AI agents. They collaborate, debate, strategize, and execute tasks in real-time. You command the destination. They navigate the journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <Link href="/dashboard">
              <button className="group relative px-8 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-lg rounded shadow-[var(--shadow-glow-lg)] hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] transition-all duration-300 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Access Command Center <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-wider mb-4">CAPABILITIES</h2>
            <div className="w-24 h-1 bg-primary mx-auto shadow-[var(--shadow-glow)]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: "Neural Swarm", desc: "8 specialized agents working in perfect sync, communicating via high-bandwidth neural pathways." },
              { icon: Activity, title: "Live Execution", desc: "Watch tasks move across the board in real-time as agents autonomously pick up work and complete it." },
              { icon: Users, title: "Virtual Boardroom", desc: "Sit in on live board meetings where your CEO, CTO, and CFO debate strategy and reach consensus." },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass-panel p-8 rounded-lg group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform shadow-[var(--shadow-glow)]">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-3">{f.title}</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
