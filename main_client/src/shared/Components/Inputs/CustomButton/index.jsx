import { setColorsMui } from '@/utils/functions';
import { Button, CircularProgress } from '@mui/material';

const CustomButton = ({
  fullWidth,
  type,
  color,
  onClick,
  disabled,
  children,
  submitting,
  ...props
}) => {
  return (
    <Button
      type={type}
      fullWidth={fullWidth}
      variant={'contained'}
      color={setColorsMui(color)}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
      {submitting && <CircularProgress size={18} color="primary" />}
    </Button>
  );
};

export default CustomButton;
