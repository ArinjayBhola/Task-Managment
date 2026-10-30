import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label="Password"
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}
