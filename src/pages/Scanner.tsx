import { Scanner as ScannerComponent } from "@/components/Scanner";
import { SplashCursor } from "@/components/ui/splash-cursor";
import { BackgroundFlow } from "@/components/BackgroundFlow";

const Scanner = () => {
  return (
    <div className="relative min-h-screen">
      <BackgroundFlow />
      <SplashCursor />
      <ScannerComponent />
    </div>
  );
};

export default Scanner;
