/* eslint-disable react/prop-types */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const Card = ({ children, className, hover = false, ...props }) => (
  <div
    className={twMerge(
      clsx(
        "rounded-xl border border-border bg-card p-6",
        hover && "transition-shadow hover:shadow-md",
        className,
      ),
    )}
    {...props}
  >
    {children}
  </div>
);
