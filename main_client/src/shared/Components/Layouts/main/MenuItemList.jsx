import { NavLink } from 'react-router-dom';
import {
  Tooltip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import useMainApp from '@/shared/Hooks/useMainApp';

const MenuItemList = ({ to, icon, name }) => {
  const { colors } = useMainApp();
  return (
    <NavLink to={to}>
      {({ isActive }) => {
        return (
          <Tooltip
            placement="right-start"
            title={name}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: colors?.HxPrimary,
                },
              },
            }}
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? colors?.HxPrimary : 'none',
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={name}
                sx={{ color: isActive ? colors?.HxPrimary : 'black' }}
              />
            </ListItemButton>
          </Tooltip>
        );
      }}
    </NavLink>
  );
};

export default MenuItemList;
