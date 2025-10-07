import { Shield } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeClasses = {
    sm: {
      icon: "w-6 h-6",
      text: "text-lg",
      gap: "gap-2"
    },
    md: {
      icon: "w-8 h-8",
      text: "text-xl",
      gap: "gap-3"
    },
    lg: {
      icon: "w-12 h-12",
      text: "text-2xl",
      gap: "gap-4"
    },
    xl: {
      icon: "w-16 h-16",
      text: "text-4xl",
      gap: "gap-5"
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.gap} ${className}`}>
      {/* Logo Image/Icon */}
      <div className="relative">
        <img 
          src="/guardian-logo.svg" 
          alt="Guardian Logo" 
          className={`${classes.icon} object-contain`}
        />
      </div>
      
      {/* Company Name */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${classes.text} font-bold text-foreground leading-tight`}>
            Guardian
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            AI Security
          </span>
        </div>
      )}
    </div>
  );
};
