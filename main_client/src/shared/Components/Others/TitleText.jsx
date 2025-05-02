import { Typography } from '@mui/material';

const TitleText = ({ text, color }) => {
  return (
    <Typography variant="h5" fontWeight={'bold'} color={color}>
      {text}
    </Typography>
  );
};

export default TitleText;
