/* eslint-disable react/prop-types */
import { useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export default function DateInput({
  label = "Date",
  value,
  onChange,
  onValidationChange,
  readOnly = false,
  required = false,
}) {
  const [invalid, setInvalid] = useState(false);
  function validate(error) {
    setInvalid(!!error);
    onValidationChange?.(!!error);
  }
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      readOnly={readOnly}
      format="DD MMM YYYY"
      onChange={(date, context) => {
        validate(context.validationError);
        if (!context.validationError && (!date || date.isValid()))
          onChange(date ? date.format("YYYY-MM-DD") : "");
      }}
      onError={validate}
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
          required,
          error: invalid,
          helperText: invalid ? "Enter a valid date." : undefined,
        },
        field: { clearable: !readOnly && !required },
      }}
    />
  );
}
