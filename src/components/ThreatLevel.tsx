import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const threatLevelVariants = cva(
  "inline-block px-2 py-1 text-xs font-semibold rounded-full",
  {
    variants: {
      level: {
        Critical: "bg-red-500 text-white",
        High: "bg-yellow-500 text-black",
        Medium: "bg-orange-500 text-white",
        Low: "bg-green-500 text-white",
      },
    },
  }
);

export interface ThreatLevelProps extends VariantProps<typeof threatLevelVariants> {
  level: 'Critical' | 'High' | 'Medium' | 'Low';
}

export const ThreatLevel = ({ level }: ThreatLevelProps) => {
  return <span className={cn(threatLevelVariants({ level }))}>{level}</span>;
};
