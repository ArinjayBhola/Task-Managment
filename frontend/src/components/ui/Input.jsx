/* eslint-disable react/prop-types */
import { useId } from "react";
import { twMerge } from "tailwind-merge";
export const Input = ({
  label,
  type = "text",
  className,
  error,
  endAdornment,
  id: suppliedId,
  ...props
}) => {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={twMerge(
            "field h-11",
            endAdornment && "pr-12",
            error && "border-destructive",
            className,
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
