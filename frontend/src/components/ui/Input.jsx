/* eslint-disable react/prop-types */
import { useId, useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
export const Input = ({
  label,
  type = "text",
  className,
  error,
  helperText,
  startAdornment,
  endAdornment,
  readOnly,
  minLength,
  maxLength,
  pattern,
  inputMode,
  min,
  max,
  step,
  onFocus,
  onBlur,
  id: suppliedId,
  ...props
}) => {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const [focused, setFocused] = useState(false);
  const value = props.value ?? props.defaultValue;
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <TextField
      {...props}
      id={id}
      type={type}
      label={label || props["aria-label"] || props.placeholder}
      variant="outlined"
      fullWidth
      size="small"
      className={className}
      error={!!error}
      helperText={error || helperText}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      slotProps={{
        inputLabel: { required: false },
        htmlInput: {
          readOnly,
          minLength,
          maxLength,
          pattern,
          inputMode,
          min,
          max,
          step,
          "aria-label": props["aria-label"],
        },
        input: {
          readOnly,
          startAdornment:
            startAdornment && (focused || hasValue) ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined,
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
};
