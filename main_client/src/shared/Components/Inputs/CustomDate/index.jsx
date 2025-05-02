import { TextField } from '@mui/material';
import { format as formatDateFn, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const getCurrentDateColombia = (format) => {
  const date = new Date().toLocaleString('en-US', {
    timeZone: 'America/Bogota',
  });
  return formatDateFn(new Date(date), format, { locale: es });
};

const CustomDate = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled,
  fullWidth,
  format = 'yyyy-MM-dd',
  inputProps = {},
}) => {
  const formattedValue = value
    ? formatDateFn(parseISO(value), format, { locale: es })
    : getCurrentDateColombia(format);

  return (
    <TextField
      fullWidth={fullWidth}
      name={name}
      label={label}
      value={formattedValue}
      onChange={onChange}
      error={error}
      disabled={disabled}
      type="date"
      variant="outlined"
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={inputProps}
    />
  );
};

export default CustomDate;
