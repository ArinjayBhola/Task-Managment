/* eslint-disable react/prop-types */
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
export const Select = ({
  label,
  options = [],
  className,
  error,
  id: suppliedId,
  ...props
}) => {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={twMerge("field h-11 appearance-none pr-10", className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
