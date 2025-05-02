import { Checkbox, FormControlLabel } from '@mui/material';

/**
 * La función CustomCheckBox es un componente React que muestra una casilla de verificación con propiedades personalizables
 * como disabled, error, checked, onChange, y label.
 * @returns Se devuelve el componente CustomCheck, que consiste en un componente FormControlLabel
 * que envuelve un componente Checkbox con las props especificadas (disabled, error, checked, onChange) y una
 * label prop.
 */
const CustomCheckBox = ({
  disabled,
  error,
  checked,
  onChange,
  label,
  fullWidth,
}) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          fullWidth={fullWidth}
          disabled={disabled}
          error={error}
          checked={checked}
          onChange={onChange}
        />
      }
      label={label}
    />
  );
};

export default CustomCheckBox;
