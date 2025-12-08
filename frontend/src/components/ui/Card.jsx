import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
      className={cn("rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl p-6 shadow-xl", className)}
      {...props}>
      {children}
    </motion.div>
  );
};
