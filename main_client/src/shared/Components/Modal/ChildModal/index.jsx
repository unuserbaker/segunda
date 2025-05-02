import { setColorsMui } from '@/utils/functions';
import { Box, IconButton, Modal, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ChildModal = ({
  children,
  open,
  handleClose,
  title = '',
  titleColor = 'success',
  minHeight = '60vh',
  minWidth = '40vw',
}) => {
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="child-modal-title"
        aria-describedby="child-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            height: '400px',
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
            <div onClick={handleClose}>
              <IconButton color="success" size="large">
                <Tooltip title="Cerrar">
                  <CloseIcon sx={{ color: titleColor }} />
                </Tooltip>
              </IconButton>
            </div>
          </div>
          {children}
        </Box>
      </Modal>
    </>
  );
};
export default ChildModal;
