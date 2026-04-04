import { useState } from "react";
import { MainLayout } from "./components/MainLayout";
import { Today } from "./pages/Today";
import { Dashboard } from "./pages/Dashboard";
import { Progress } from "./pages/Progress";
import { JobTracker } from "./pages/JobTracker";
import Notes from "./pages/Notes";
import { Onboarding } from "./pages/Onboarding";
import { Accounts } from "./pages/Accounts";
import { useOnboardingStore } from "./store/useOnboardingStore";

function App() {
  const [activeRoute, setActiveRoute] = useState("today");
  const { completed } = useOnboardingStore();
  const [showOnboarding, setShowOnboarding] = useState(!completed);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (showOnboarding && !completed) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <MainLayout activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {activeRoute === "today" ? <Today /> : null}
      {activeRoute === "dashboard" ? <Dashboard /> : null}
      {activeRoute === "progress" ? <Progress /> : null}
      {activeRoute === "jobs" ? <JobTracker /> : null}
      {activeRoute === "notes" ? <Notes /> : null}
      {activeRoute === "accounts" ? <Accounts /> : null}
    </MainLayout>
  );
}

export default App;
