import { setColorsMui } from '@/utils/functions';
import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Modal, Tooltip, Typography } from '@mui/material';

/**
 * La función CustomModal es un componente React que muestra un diálogo modal con contenido personalizable.
 * contenido personalizable y maneja su visibilidad y funcionalidad de cierre.
 * @returns La función CustomModal devuelve un elemento JSX.
 */
const CustomModal = ({
  open,
  onClose,
  title,
  children,
  titleColor = 'success',
  minWidth = '60vw',
  minHeight = '70vh',
  maxHeight = '80vh',
  height = '10vh',
  width = '10vw',
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          overflowY: 'scroll',
          p: 2,
          borderRadius: 3,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#d1d1d1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#a7a7a7',
            borderRadius: '6px',
          },
          minHeight,
          minWidth,
          maxHeight,
          height,
          width,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            {...{
              variant: 'h4',
              fontWeight: 'bold',
              ...(setColorsMui(titleColor)
                ? {
                    color: undefined,
                  }
                : { style: { color: titleColor } }),
            }}
          >
            {title}
          </Typography>
          <div onClick={onClose}>
            <IconButton color="success" size="large">
              <Tooltip title="Cerrar">
                <CloseIcon sx={{ color: titleColor }} />
              </Tooltip>
            </IconButton>
          </div>
        </div>
        <div>{children}</div>
      </Box>
    </Modal>
  );
};

export default CustomModal;
