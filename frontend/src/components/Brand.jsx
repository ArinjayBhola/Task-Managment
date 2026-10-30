import { Link } from "react-router-dom";
import { Check } from "lucide-react";
// eslint-disable-next-line react/prop-types
export default function Brand({ to = "/", compact = false }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2.5 text-foreground"
      aria-label="TaskMaster home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
        <Check size={20} strokeWidth={3} />
      </span>
      {!compact && (
        <span className="text-[19px] font-semibold tracking-[-0.7px]">
          taskmaster<span className="text-primary">.</span>
        </span>
      )}
    </Link>
  );
}
