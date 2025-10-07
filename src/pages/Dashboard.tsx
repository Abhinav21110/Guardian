import { Dashboard as DashboardComponent } from "@/components/Dashboard";
import { SplashCursor } from "@/components/ui/splash-cursor";
import { BackgroundFlow } from "@/components/BackgroundFlow";

const Dashboard = () => {
  return (
    <div className="relative min-h-screen">
      <BackgroundFlow />
      <SplashCursor />
      <DashboardComponent />
    </div>
  );
};

export default Dashboard;
