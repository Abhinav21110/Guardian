import { SplashCursor } from "@/components/ui/splash-cursor";
import { BackgroundFlow } from "@/components/BackgroundFlow";
import { Hero } from "@/components/Hero";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      {/* Flowing Background */}
      <BackgroundFlow />
      
      {/* Fluid Cursor Effect (behind content) */}
      <SplashCursor />
      
      {/* Hero Section */}
      <Hero />
    </div>
  );
};

export default Index;
