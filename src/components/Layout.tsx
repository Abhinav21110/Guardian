import { Navigation } from "./Navigation";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-small-black/[0.1] dark:bg-grid-small-white/[0.1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
      </div>
      
      <Navigation />
      <main className="relative z-10 pt-20">{children}</main>
      <footer className="relative py-12 px-6 glass border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 Guardian AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
