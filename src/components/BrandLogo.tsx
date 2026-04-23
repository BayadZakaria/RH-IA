import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
}

export function BrandLogo({ className, size = "md", withText = true }: BrandLogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const iconMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };

  const textMap = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", sizeMap[size])}>
        {/* Animated aura background */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 8, ease: "linear" },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600 via-violet-600 to-indigo-600 rounded-2xl opacity-70 blur-md"
        />
        
        {/* Solid inner core */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="relative w-full h-full bg-gray-900 rounded-xl border border-white/20 flex items-center justify-center shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle moving inner gradient */}
          <motion.div 
            animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 blur-sm"
          />
          <Sparkles className={cn("text-white relative z-20", iconMap[size])} />
        </motion.div>
      </div>

      {withText && (
        <div className="flex flex-col leading-tight pt-1">
          <span className={cn("font-black tracking-tight text-gray-900 uppercase", textMap[size])}>
            Evo<span className="text-violet-600">lia</span>
          </span>
          <span className={cn("font-bold text-gray-400 uppercase tracking-widest -mt-0.5", size === 'sm' ? 'text-[8px]' : 'text-[10px]')}>
            AI Analytics
          </span>
        </div>
      )}
    </div>
  );
}
