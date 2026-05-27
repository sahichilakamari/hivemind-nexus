import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { ParticlesBackground } from "@/components/particles";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Headquarters from "@/pages/headquarters";
import Goals from "@/pages/goals";
import GoalDetails from "@/pages/goal-details";
import Meetings from "@/pages/meetings";
import MeetingDetails from "@/pages/meeting-details";
import Tasks from "@/pages/tasks";
import Metrics from "@/pages/metrics";
import Simulations from "@/pages/simulations";
import Reports from "@/pages/reports";
import Network from "@/pages/network";
import Github from "@/pages/github";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      {/* App Routes wrapped in Layout */}
      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/headquarters" component={Headquarters} />
            <Route path="/goals" component={Goals} />
            <Route path="/goals/:id" component={GoalDetails} />
            <Route path="/meetings" component={Meetings} />
            <Route path="/meetings/:id" component={MeetingDetails} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/metrics" component={Metrics} />
            <Route path="/simulations" component={Simulations} />
            <Route path="/reports" component={Reports} />
            <Route path="/network" component={Network} />
            <Route path="/github" component={Github} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ParticlesBackground />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
