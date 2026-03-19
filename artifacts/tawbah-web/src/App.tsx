import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/context/SettingsContext";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Covenant from "@/pages/covenant";
import DayOne from "@/pages/day-one";
import Plan from "@/pages/plan";
import Dhikr from "@/pages/dhikr";
import Sos from "@/pages/sos";
import Signs from "@/pages/signs";
import Relapse from "@/pages/relapse";
import Kaffarah from "@/pages/kaffarah";
import Rajaa from "@/pages/rajaa";
import Zakiy from "@/pages/zakiy";
import Journal from "@/pages/journal";
import ProgressChart from "@/pages/progress-chart";
import DangerTimes from "@/pages/danger-times";
import HadiTasks from "@/pages/hadi-tasks";
import TawbahCard from "@/pages/tawbah-card";
import ChallengeCreate from "@/pages/challenge-create";
import ChallengeView from "@/pages/challenge-view";
import TawbahMap from "@/pages/tawbah-map";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/covenant" component={Covenant} />
        <Route path="/day-one" component={DayOne} />
        <Route path="/plan" component={Plan} />
        <Route path="/dhikr" component={Dhikr} />
        <Route path="/sos" component={Sos} />
        <Route path="/signs" component={Signs} />
        <Route path="/relapse" component={Relapse} />
        <Route path="/kaffarah" component={Kaffarah} />
        <Route path="/rajaa" component={Rajaa} />
        <Route path="/zakiy" component={Zakiy} />
        <Route path="/journal" component={Journal} />
        <Route path="/progress" component={ProgressChart} />
        <Route path="/danger-times" component={DangerTimes} />
        <Route path="/hadi-tasks" component={HadiTasks} />
        <Route path="/card" component={TawbahCard} />
        <Route path="/challenge/create" component={ChallengeCreate} />
        <Route path="/challenge/:slug" component={ChallengeView} />
        <Route path="/map" component={TawbahMap} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </SettingsProvider>
  );
}

export default App;
