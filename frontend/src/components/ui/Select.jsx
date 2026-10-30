/* eslint-disable react/prop-types */
import { useId } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MuiSelect from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";

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
    <FormControl fullWidth size="small" error={!!error} className={className}>
      {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
      <MuiSelect
        id={id}
        labelId={label ? `${id}-label` : undefined}
        label={label}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};
