import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/context/SettingsContext";
import { NotificationsProvider, useNotifications } from "@/context/NotificationsContext";
import { AppNotificationsProvider } from "@/context/AppNotificationsContext";
import { DuaPeakModal } from "@/components/DuaPeakModal";
import { AdhkarModal } from "@/components/AdhkarModal";

import { Layout } from "@/components/layout";
import AdminApp from "@/pages/admin/AdminApp";
import Home from "@/pages/home";
import Covenant from "@/pages/covenant";
import DayOne from "@/pages/day-one";

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
import InboxPage from "@/pages/inbox";
import DuaTiming from "@/pages/dua-timing";
import HabitsPage from "@/pages/habits";
import IslamicPrograms from "@/pages/islamic-programs";
import ProgramDetail from "@/pages/program-detail";
import Garden from "@/pages/garden";
import Munajat from "@/pages/munajat";
import Adhkar from "@/pages/adhkar";
import QuranPage from "@/pages/quran";
import QuranReadPage from "@/pages/quran/read";
import QuranListenPage from "@/pages/quran/listen";
import QuranMemorizePage from "@/pages/quran/memorize";
import QuranTafsirPage from "@/pages/quran/tafsir";
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
        <Route path="/plan" component={HabitsPage} />
        <Route path="/habits" component={HabitsPage} />
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
        <Route path="/inbox" component={InboxPage} />
        <Route path="/dua-timing" component={DuaTiming} />
        <Route path="/islamic-programs" component={IslamicPrograms} />
        <Route path="/islamic-programs/:id" component={ProgramDetail} />
        <Route path="/garden" component={Garden} />
        <Route path="/munajat" component={Munajat} />
        <Route path="/adhkar" component={Adhkar} />
        <Route path="/quran/read" component={QuranReadPage} />
        <Route path="/quran/listen" component={QuranListenPage} />
        <Route path="/quran/memorize" component={QuranMemorizePage} />
        <Route path="/quran/tafsir" component={QuranTafsirPage} />
        <Route path="/quran" component={QuranPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function DuaPeakModalBridge() {
  const { duaPeakVisible, hideDuaPeak } = useNotifications();
  return <DuaPeakModal visible={duaPeakVisible} onClose={hideDuaPeak} />;
}

function AdhkarModalBridge() {
  const { adhkarVisible, adhkarType, hideAdhkar } = useNotifications();
  return <AdhkarModal visible={adhkarVisible} type={adhkarType} onClose={hideAdhkar} />;
}

function App() {
  return (
    <SettingsProvider>
      <NotificationsProvider>
        <AppNotificationsProvider>
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
            <DuaPeakModalBridge />
            <AdhkarModalBridge />
          </TooltipProvider>
        </QueryClientProvider>
        </AppNotificationsProvider>
      </NotificationsProvider>
    </SettingsProvider>
  );
}

export default App;
