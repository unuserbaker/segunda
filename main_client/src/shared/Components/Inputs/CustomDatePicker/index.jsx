import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import { FormControl } from '@mui/material';
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

dayjs.extend(utc);

const CustomDateField = ({
  name,
  label,
  views = ['month', 'year'],
  value,
  format = 'MM/YYYY',
  onHandleChange,
  minDate,
  maxDate,
  ...props
}) => {
  const initialValue = value ? dayjs.utc(value) : dayjs.utc();
  const [fecha, setFecha] = useState(initialValue);
  const { setFieldValue } = useFormikContext();

  useEffect(() => {
    setFieldValue(name, fecha.format(format));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, name, format]);

  useEffect(() => {
    if (value) setFecha(dayjs.utc(value));
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <FormControl fullWidth error={false}>
        <DatePicker
          autoFocus={false}
          name={name}
          label={label}
          views={views}
          value={fecha}
          onChange={(newDate) => {
            if (newDate) setFecha(dayjs.utc(newDate.$d));
            onHandleChange &&
              onHandleChange(dayjs.utc(newDate.$d).format(format));
          }}
          closeOnSelect={true}
          slotProps={{ textField: { variant: 'outlined' } }}
          {...props}
          {...(minDate && { minDate: dayjs.utc(minDate) })}
          {...(maxDate && { maxDate: dayjs.utc(maxDate) })}
        />
      </FormControl>
    </LocalizationProvider>
  );
};

export default CustomDateField;
