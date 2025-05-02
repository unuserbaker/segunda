import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const CustomSelect = ({
  label,
  id,
  name,
  value,
  onChange,
  options,
  error = false,
  disabled = false,
  labelSelectDefault = 'Seleccionar',
  ...props
}) => {
  return (
    <FormControl fullWidth error={error}>
      <InputLabel id={id}>{label}</InputLabel>
      <Select
        label={label}
        variant="outlined"
        labelId={id}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {[{ value: '-1', label: labelSelectDefault }, ...options]?.map(
          (option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          )
        )}
      </Select>
    </FormControl>
  );
};

export default CustomSelect;
