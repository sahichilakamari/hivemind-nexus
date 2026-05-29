import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import CommandCenter from "@/pages/CommandCenter";
import Goals from "@/pages/Goals";
import GoalDetail from "@/pages/GoalDetail";
import Meetings from "@/pages/Meetings";
import MeetingDetail from "@/pages/MeetingDetail";
import Tasks from "@/pages/Tasks";
import Metrics from "@/pages/Metrics";
import Simulations from "@/pages/Simulations";
import Reports from "@/pages/Reports";
import Agents from "@/pages/Agents";
import GithubSync from "@/pages/Github";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={CommandCenter} />
        <Route path="/goals" component={Goals} />
        <Route path="/goals/:id" component={GoalDetail} />
        <Route path="/meetings" component={Meetings} />
        <Route path="/meetings/:id" component={MeetingDetail} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/metrics" component={Metrics} />
        <Route path="/simulations" component={Simulations} />
        <Route path="/reports" component={Reports} />
        <Route path="/agents" component={Agents} />
        <Route path="/github" component={GithubSync} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
