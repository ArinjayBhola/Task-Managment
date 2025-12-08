import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Select = ({ label, options = [], className, error, ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground ml-1">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-lg border border-input bg-white/5 px-4 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#0f172a] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive ml-1">{error}</p>}
    </div>
  );
};
