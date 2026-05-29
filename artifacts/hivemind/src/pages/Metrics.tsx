import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useListMetrics, useListGoals } from "@workspace/api-client-react";
import {
  TrendingUp, TrendingDown, Minus,
  BarChart2, Target, ChevronDown, CheckCircle2, Clock, Zap,
  GitCompare, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, Legend, CartesianGrid,
} from "recharts";
import {
  Tooltip as UITooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, stable: Minus };
const TREND_COLORS = {
  up: "text-chart-3",
  down: "text-destructive",
  stable: "text-muted-foreground",
};
const STATUS_ICONS = {
  active: Zap,
  completed: CheckCircle2,
  pending: Clock,
  failed: Minus,
};
const STATUS_COLORS = {
  active: "text-chart-3",
  completed: "text-chart-1",
  pending: "text-chart-5",
  failed: "text-destructive",
};

export default function Metrics() {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  const { data: allMetrics, isLoading: metricsLoading } = useListMetrics();
  const { data: goals, isLoading: goalsLoading } = useListGoals();

  const isLoading = metricsLoading || goalsLoading;

  // Goals that have at least one metric
  const goalsWithMetrics = useMemo(() => {
    if (!goals || !allMetrics) return [];
    const idsWithMetrics = new Set(allMetrics.map(m => m.goalId).filter(Boolean));
    return goals.filter(g => idsWithMetrics.has(g.id));
  }, [goals, allMetrics]);

  // Active filter: null = all metrics, number = specific goal
  const metrics = useMemo(() => {
    if (!allMetrics) return [];
    if (selectedGoalId === null) return allMetrics;
    return allMetrics.filter(m => m.goalId === selectedGoalId);
  }, [allMetrics, selectedGoalId]);

  const selectedGoal = goals?.find(g => g.id === selectedGoalId) ?? null;

  const chartData = metrics.map(m => ({
    name: m.label || m.metricType,
    value: m.value,
    unit: m.unit,
  }));

  const radarData = metrics.map(m => ({
    subject: m.label.length > 14 ? m.label.substring(0, 12) + "…" : m.label,
    A: Math.min(100, Math.max(0, m.value > 100 ? Math.log10(m.value + 1) * 25 : m.value)),
    fullMark: 100,
  }));

  const hasAnyMetrics = (allMetrics?.length ?? 0) > 0;
  const hasFilteredMetrics = metrics.length > 0;

  // ── Timeline data ──────────────────────────────────────────────────────────
  // Build per-goal trend points, ordered chronologically.
  // Each point has normalized (0-100) values so disparate units coexist on one axis,
  // plus raw values exposed via the custom tooltip.
  const { trendData, trendKeys } = useMemo(() => {
    if (!allMetrics || !goalsWithMetrics.length) return { trendData: [], trendKeys: [] };

    // Collect all metric types that appear across goals with metrics
    const typeSet = new Set<string>();
    allMetrics.forEach(m => { if (m.goalId) typeSet.add(m.metricType); });
    const types = Array.from(typeSet);

    // For each type, find max value to normalise
    const maxByType: Record<string, number> = {};
    const unitByType: Record<string, string> = {};
    const labelByType: Record<string, string> = {};
    types.forEach(t => {
      const vals = allMetrics.filter(m => m.metricType === t).map(m => m.value);
      maxByType[t] = Math.max(...vals, 1);
      const sample = allMetrics.find(m => m.metricType === t);
      unitByType[t] = sample?.unit ?? "";
      labelByType[t] = sample?.label ?? t.replace(/_/g, " ");
    });

    // Sort goals chronologically
    const sortedGoals = [...goalsWithMetrics].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const data = sortedGoals.map((goal, idx) => {
      const point: Record<string, unknown> = {
        goal: goal.title.length > 18 ? goal.title.substring(0, 16) + "…" : goal.title,
        goalFull: goal.title,
        index: idx + 1,
      };
      const goalM = allMetrics.filter(m => m.goalId === goal.id);
      types.forEach(t => {
        const match = goalM.find(m => m.metricType === t);
        if (match) {
          point[t] = parseFloat(((match.value / maxByType[t]) * 100).toFixed(1));
          point[`${t}_raw`] = match.value;
          point[`${t}_unit`] = unitByType[t];
        }
      });
      return point;
    });

    return { trendData: data, trendKeys: types.map(t => ({ key: t, label: labelByType[t], unit: unitByType[t] })) };
  }, [allMetrics, goalsWithMetrics]);

  // Palette for trend lines — violet, fuchsia, aurora green, amber, indigo, red
  const LINE_PALETTE = [
    "hsl(265 85% 65%)",
    "hsl(320 85% 60%)",
    "hsl(150 80% 50%)",
    "hsl(45 95% 60%)",
    "hsl(245 80% 65%)",
    "hsl(340 85% 60%)",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metrics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time KPIs generated by your AI workforce.
          </p>
        </div>

        {/* Goal filter — only shown when there are metrics */}
        {hasAnyMetrics && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-border/60 min-w-[180px] justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="truncate text-sm">
                    {selectedGoal ? selectedGoal.title : "All Goals"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border-border">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Filter by Goal</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* All Goals option */}
              <DropdownMenuItem
                onClick={() => setSelectedGoalId(null)}
                className="gap-2 cursor-pointer"
                data-testid="filter-all-goals"
              >
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">All Goals</span>
                {selectedGoalId === null && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {goalsWithMetrics.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  No goals with metrics yet
                </DropdownMenuItem>
              ) : (
                goalsWithMetrics.map(goal => {
                  const StatusIcon = STATUS_ICONS[goal.status as keyof typeof STATUS_ICONS] || Clock;
                  const statusColor = STATUS_COLORS[goal.status as keyof typeof STATUS_COLORS] || "text-muted-foreground";
                  const count = allMetrics?.filter(m => m.goalId === goal.id).length ?? 0;
                  return (
                    <DropdownMenuItem
                      key={goal.id}
                      onClick={() => setSelectedGoalId(goal.id)}
                      className="gap-2 cursor-pointer"
                      data-testid={`filter-goal-${goal.id}`}
                    >
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                      <span className="flex-1 truncate text-sm">{goal.title}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">{count}</span>
                        {selectedGoalId === goal.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Active filter banner */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">Showing metrics for: </span>
                <span className="text-sm text-primary font-semibold truncate">{selectedGoal.title}</span>
              </div>
              <Badge variant="outline" className={`text-xs border flex-shrink-0 ${
                selectedGoal.status === "completed"
                  ? "border-chart-1/30 bg-chart-1/10 text-chart-1"
                  : selectedGoal.status === "active"
                  ? "border-chart-3/30 bg-chart-3/10 text-chart-3"
                  : "border-border text-muted-foreground"
              }`}>
                {selectedGoal.status.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedGoalId(null)}
                data-testid="clear-goal-filter"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !hasAnyMetrics ? (
        /* No metrics at all — prompt to create a goal */
        <Card className="glass-card border-white/10">
          <CardContent className="py-24 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <BarChart2 className="h-16 w-16 text-muted-foreground opacity-20 mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold font-mono text-muted-foreground opacity-40">0</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">No metrics yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Metrics are generated by your AI workforce after they analyze a business goal.
                <br />
                <span className="text-primary font-medium">Deploy a goal first</span> — agents will
                produce real KPIs automatically.
              </p>
            </div>
            <Link href="/goals">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Target className="h-4 w-4" /> Deploy a Goal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : !hasFilteredMetrics ? (
        /* Metrics exist but none for selected goal */
        <Card className="glass-card border-white/10">
          <CardContent className="py-20 text-center space-y-3">
            <Target className="h-10 w-10 text-muted-foreground opacity-30 mx-auto" />
            <p className="font-medium">No metrics for this goal yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              This goal's AI analysis hasn't produced KPIs yet, or it may still be running.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setSelectedGoalId(null)}
            >
              View all metrics instead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {metrics.map((metric, i) => {
                const trend = metric.trend as "up" | "down" | "stable" | null | undefined;
                const TrendIcon = trend ? TREND_ICONS[trend] : Minus;
                const trendColor = trend ? TREND_COLORS[trend] : "text-muted-foreground";
                return (
                  <motion.div
                    key={metric.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card
                      className="glass-card border-white/10 hover:border-primary/20 transition-all duration-200"
                      data-testid={`metric-card-${metric.id}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                          {metric.label || metric.metricType}
                          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold font-mono">
                            {metric.value >= 1_000_000
                              ? `${(metric.value / 1_000_000).toFixed(1)}M`
                              : metric.value >= 1000
                              ? `${(metric.value / 1000).toFixed(1)}k`
                              : metric.value % 1 === 0
                              ? metric.value.toFixed(0)
                              : metric.value.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground mb-1">{metric.unit}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground font-mono uppercase">
                            {metric.metricType.replace(/_/g, " ")}
                          </p>
                          {trend && (
                            <span className={`text-xs font-mono ${trendColor}`}>
                              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trend}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  KPI Overview
                  {selectedGoal && (
                    <span className="ml-auto text-xs text-muted-foreground font-normal font-mono truncate max-w-[160px]">
                      {selectedGoal.title}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "hsl(245 20% 65%)" }}
                      angle={-18}
                      textAnchor="end"
                      height={44}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(245 20% 65%)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(235 60% 6%)",
                        border: "1px solid hsl(245 40% 16%)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "hsl(240 20% 98%)" }}
                      formatter={(value: number, _: string, entry: { payload?: { unit?: string } }) => [
                        `${value.toLocaleString()} ${entry.payload?.unit ?? ""}`,
                        "Value",
                      ]}
                    />
                    <Bar dataKey="value" fill="hsl(265 85% 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  Performance Radar
                  {selectedGoal && (
                    <span className="ml-auto text-xs text-muted-foreground font-normal font-mono truncate max-w-[160px]">
                      {selectedGoal.title}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(245 40% 16%)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 10, fill: "hsl(245 20% 65%)" }}
                    />
                    <Radar
                      name="KPIs"
                      dataKey="A"
                      stroke="hsl(320 85% 50%)"
                      fill="hsl(320 85% 50%)"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary row — only for "All Goals" view when multiple goals exist */}
          {selectedGoalId === null && goalsWithMetrics.length > 1 && (
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-sm">Goals Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goalsWithMetrics.map(goal => {
                    const goalMetrics = allMetrics?.filter(m => m.goalId === goal.id) ?? [];
                    const StatusIcon = STATUS_ICONS[goal.status as keyof typeof STATUS_ICONS] || Clock;
                    const statusColor = STATUS_COLORS[goal.status as keyof typeof STATUS_COLORS] || "text-muted-foreground";
                    return (
                      <div
                        key={goal.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-white/5 hover:border-primary/20 transition-colors cursor-pointer group"
                        onClick={() => setSelectedGoalId(goal.id)}
                        data-testid={`summary-goal-${goal.id}`}
                      >
                        <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                        <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors truncate">
                          {goal.title}
                        </span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-muted-foreground font-mono">
                            {goalMetrics.length} KPI{goalMetrics.length !== 1 ? "s" : ""}
                          </span>
                          <div className="flex gap-1">
                            {goalMetrics.slice(0, 3).map(m => {
                              const t = m.trend as "up" | "down" | "stable" | undefined;
                              return (
                                <span
                                  key={m.id}
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                    t === "up"
                                      ? "text-chart-3 border-chart-3/20 bg-chart-3/10"
                                      : t === "down"
                                      ? "text-destructive border-destructive/20 bg-destructive/10"
                                      : "text-muted-foreground border-border bg-muted/30"
                                  }`}
                                >
                                  {m.label.substring(0, 8)}
                                </span>
                              );
                            })}
                            {goalMetrics.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-mono px-1">
                                +{goalMetrics.length - 3}
                              </span>
                            )}
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground -rotate-90 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── KPI History Timeline — shown in both "All" and filtered views ── */}
          {trendData.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitCompare className="h-4 w-4 text-primary" />
                    KPI History Timeline
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-xs">
                        Each KPI is normalised to 0–100% relative to its own peak value so
                        different units (USD, users, %) can coexist on one chart.
                        Hover a point to see the real value.
                      </TooltipContent>
                    </UITooltip>
                    <span className="ml-auto text-xs text-muted-foreground font-normal font-mono">
                      normalised · hover for raw values
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(245 40% 12%)" vertical={false} />
                      <XAxis
                        dataKey="goal"
                        tick={{ fontSize: 11, fill: "hsl(245 20% 65%)" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(245 40% 16%)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "hsl(245 20% 65%)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(235 60% 5%)",
                          border: "1px solid hsl(245 40% 18%)",
                          borderRadius: 10,
                          fontSize: 12,
                          padding: "10px 14px",
                        }}
                        labelStyle={{ color: "hsl(240 20% 95%)", fontWeight: 600, marginBottom: 6 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div
                              style={{
                                background: "hsl(235 60% 5%)",
                                border: "1px solid hsl(245 40% 18%)",
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontSize: 12,
                                minWidth: 180,
                              }}
                            >
                              <p style={{ color: "hsl(240 20% 95%)", fontWeight: 600, marginBottom: 8 }}>
                                {payload[0]?.payload?.goalFull ?? label}
                              </p>
                              {payload.map((entry) => {
                                const rawKey = `${entry.dataKey}_raw`;
                                const unitKey = `${entry.dataKey}_unit`;
                                const raw = entry.payload?.[rawKey];
                                const unit = entry.payload?.[unitKey] ?? "";
                                const display = raw != null
                                  ? (raw >= 1_000_000
                                    ? `${(raw / 1_000_000).toFixed(2)}M`
                                    : raw >= 1000
                                    ? `${(raw / 1000).toFixed(1)}k`
                                    : String(raw))
                                  : `${entry.value}%`;
                                return (
                                  <div key={entry.dataKey as string} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
                                    <span style={{ color: entry.color as string }}>{entry.name}</span>
                                    <span style={{ color: "hsl(240 20% 90%)", fontFamily: "monospace", fontWeight: 600 }}>
                                      {display} {unit && raw != null ? unit : ""}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                        formatter={(value) => {
                          const k = trendKeys.find(t => t.key === value);
                          return <span style={{ color: "hsl(245 20% 70%)" }}>{k?.label ?? value}</span>;
                        }}
                      />
                      {trendKeys.map((tk, i) => (
                        <Line
                          key={tk.key}
                          type="monotone"
                          dataKey={tk.key}
                          name={tk.key}
                          stroke={LINE_PALETTE[i % LINE_PALETTE.length]}
                          strokeWidth={2.5}
                          dot={{
                            r: 4,
                            fill: LINE_PALETTE[i % LINE_PALETTE.length],
                            strokeWidth: 0,
                          }}
                          activeDot={{
                            r: 6,
                            fill: LINE_PALETTE[i % LINE_PALETTE.length],
                            stroke: "hsl(235 60% 5%)",
                            strokeWidth: 2,
                          }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Goal Comparison Bar Chart ── */}
          {trendData.length >= 2 && selectedGoalId === null && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-4 w-4 text-secondary" />
                    Goal-by-Goal KPI Comparison
                    <span className="ml-auto text-xs text-muted-foreground font-normal font-mono">
                      normalised · grouped by goal
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={trendData} barCategoryGap="20%" barGap={2} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(245 40% 12%)" vertical={false} />
                      <XAxis
                        dataKey="goal"
                        tick={{ fontSize: 11, fill: "hsl(245 20% 65%)" }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(245 40% 16%)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "hsl(245 20% 65%)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(235 60% 5%)",
                          border: "1px solid hsl(245 40% 18%)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "hsl(240 20% 95%)", fontWeight: 600 }}
                        formatter={(value: number, key: string) => {
                          const k = trendKeys.find(t => t.key === key);
                          return [`${value}%`, k?.label ?? key];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                        formatter={(value) => {
                          const k = trendKeys.find(t => t.key === value);
                          return <span style={{ color: "hsl(245 20% 70%)" }}>{k?.label ?? value}</span>;
                        }}
                      />
                      {trendKeys.map((tk, i) => (
                        <Bar
                          key={tk.key}
                          dataKey={tk.key}
                          name={tk.key}
                          fill={LINE_PALETTE[i % LINE_PALETTE.length]}
                          radius={[3, 3, 0, 0]}
                          fillOpacity={0.85}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
