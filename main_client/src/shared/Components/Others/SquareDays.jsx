import { Avatar, Box } from '@mui/material';

const SquareDays = ({ onClick, cantidad, color }) => {
  return (
    <Box onClick={onClick} sx={{display:'flex', alignItems:'center', justifyContent:'center'}}>
      <Avatar variant="rounded" sx={{ bgcolor: color, cursor: 'pointer'}}>
        {cantidad}
      </Avatar>
    </Box>
  );
};

export default SquareDays;
