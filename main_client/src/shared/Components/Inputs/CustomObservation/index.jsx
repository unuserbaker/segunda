import { TextField, FormControl } from '@mui/material';

const CustomObservation = ({
  label,
  name,
  type,
  value,
  onChange,
  error,
  disabled,
  fullWidth,
}) => {
  return (
    <FormControl fullWidth error={error}>
      <TextField
        fullWidth={fullWidth}
        name={name}
        type={type}
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
        multiline
      />
    </FormControl>
  );
};

export default CustomObservation;
