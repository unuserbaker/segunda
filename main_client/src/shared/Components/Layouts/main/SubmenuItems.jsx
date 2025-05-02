import { useMemo, useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
import {
  Tooltip,
  Menu,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import useMainApp from '@/shared/Hooks/useMainApp';

const StyledMenu = styled((props) => (
  <Menu
    elevation={4}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === 'light'
        ? 'rgb(55, 65, 81)'
        : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

const renderChildrens = (children, colors = {}) => {
  return children?.map((elem, index) => (
    <div key={index}>
      {elem?.children && elem.children.length > 0 ? (
        renderChildrens({ item: elem })
      ) : (
        <NavLink to={elem.to} key={elem.name} sx={{ p: 0, m: 0 }}>
          {({ isActive }) => {
            return (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
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
                  {elem.icon}
                </ListItemIcon>
                <ListItemText
                  primary={elem.name}
                  sx={{ color: isActive ? colors?.HxPrimary : 'black' }}
                />
              </div>
              // <MenuItem
              //   disableRipple
              //   sx={{ color: isActive ? colors?.HxPrimary : 'black' }}
              // >
              //   {elem.icon}
              //   {elem.name}
              // </MenuItem>
            );
          }}
        </NavLink>
      )}
    </div>
  ));
};

const SubMenuItemList = ({ elem }) => {
  const location = useLocation();
  const { colors } = useMainApp();
  const [anchorEl, setAnchorEl] = useState(null);

  const isActive = useMemo(
    () => location.pathname.includes(elem.name),
    [location, elem]
  );
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    if (anchorEl) return setAnchorEl(null);
    setAnchorEl(event.currentTarget);
  };

  return (
    <Tooltip
      title={elem.name}
      placement="right-start"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: colors?.HxPrimary,
          },
        },
      }}
    >
      <ListItemButton sx={{ minHeight: 48, px: 2.5 }} onClick={handleClick}>
        <ListItemIcon
          sx={{
            color: isActive ? colors?.HxPrimary : 'none',
            minWidth: 0,
            mr: 3,
            justifyContent: 'center',
          }}
        >
          {elem.icon}
        </ListItemIcon>
        <ListItemText
          primary={elem?.name || ''}
          sx={{ color: isActive ? colors?.HxPrimary : 'none' }}
        />
        <StyledMenu
          id="demo-customized-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClick}
        >
          {renderChildrens(elem?.children, colors)}
        </StyledMenu>
      </ListItemButton>
    </Tooltip>
  );
};

export default SubMenuItemList;
