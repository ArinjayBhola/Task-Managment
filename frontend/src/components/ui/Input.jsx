import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Input = ({ label, type = "text", className, error, ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground ml-1">{label}</label>}
      <motion.div
        whileFocus={{ scale: 1.01 }}
        className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-input bg-white/5 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
      </motion.div>
      {error && <p className="text-xs text-destructive ml-1">{error}</p>}
    </div>
  );
};
