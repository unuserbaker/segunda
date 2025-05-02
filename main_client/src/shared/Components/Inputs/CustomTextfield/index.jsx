import { TextField, FormControl } from '@mui/material';

const CustomTextField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  disabled,
  fullWidth,
  ...props
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
        {...props}
      />
    </FormControl>
  );
};

export default CustomTextField;
