import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

import { Layout } from "@/components/layout";
import AdminApp from "@/pages/admin/AdminApp";
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
import Journey30 from "@/pages/journey30";
import DhikrRooms from "@/pages/dhikr-rooms";
import SecretDua from "@/pages/secret-dua";
import PrayerTimes from "@/pages/prayer-times";
import CommunityDuas from "@/pages/community-duas";
import Account from "@/pages/account";
import SinsList from "@/pages/sins-list";
import EidPage from "@/pages/eid";
import NotificationsPage from "@/pages/notifications";
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
        <Route path="/journey" component={Journey30} />
        <Route path="/dhikr-rooms" component={DhikrRooms} />
        <Route path="/secret-dua" component={SecretDua} />
        <Route path="/prayer-times" component={PrayerTimes} />
        <Route path="/ameen" component={CommunityDuas} />
        <Route path="/account" component={Account} />
        <Route path="/sins" component={SinsList} />
        <Route path="/eid" component={EidPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Switch>
                <Route path="/admin" component={AdminApp} />
                <Route path="/admin/:rest*" component={AdminApp} />
                <Route>
                  <Router />
                </Route>
              </Switch>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </NotificationsProvider>
    </SettingsProvider>
  );
}

export default App;
