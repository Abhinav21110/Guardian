import { Shield, Scan, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="container relative z-10 mx-auto px-6 py-32 text-center">
        {/* Main Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="xl" className="animate-float" />
        </div>

        {/* Hero Text */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-foreground animate-fade-in">
          Guardian AI
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-slide-up">
          Advanced Threat Detection and Protection Platform
        </p>
        
        <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-slide-up [animation-delay:0.2s]">
          Powered by advanced AI and machine learning, Guardian scans URLs, emails, and files in real-time to protect your organization from sophisticated cyber threats.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up [animation-delay:0.4s]">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-elegant transition-all duration-300 hover:scale-105"
          >
            <Scan className="mr-2 h-5 w-5" />
            Start Scanning
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="glass-hover text-lg px-8 py-6 transition-all duration-300 hover:scale-105"
          >
            View Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { label: "Threats Blocked", value: "2.1M+", icon: Shield },
            { label: "Detection Rate", value: "99.9%", icon: Scan },
            { label: "Protected Users", value: "75K+", icon: Users },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-hover p-6 rounded-2xl animate-slide-up shadow-elegant"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-foreground" strokeWidth={1.5} />
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
