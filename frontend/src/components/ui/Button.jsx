/* eslint-disable react/prop-types */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const variants = {
  default:
    "border border-transparent bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost:
    "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  danger:
    "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
};
const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};
export const Button = ({
  children,
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={twMerge(
      clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      ),
    )}
    {...props}
  >
    {children}
  </button>
);
