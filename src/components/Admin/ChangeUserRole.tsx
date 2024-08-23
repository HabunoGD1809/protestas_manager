import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface ChangeUserRoleProps {
  userId: string;
  currentRole: 'admin' | 'usuario';
  onRoleChange: (newRole: 'admin' | 'usuario') => void;
  disabled?: boolean;
}

const ChangeUserRole: React.FC<ChangeUserRoleProps> = ({ currentRole, onRoleChange, disabled }): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (newRole: 'admin' | 'usuario') => {
    onRoleChange(newRole);
    handleClose();
  };

  return (
    <>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        disabled={disabled}
      >
        Cambiar Rol
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleRoleChange('admin')} disabled={currentRole === 'admin'}>
          Admin
        </MenuItem>
        <MenuItem onClick={() => handleRoleChange('usuario')} disabled={currentRole === 'usuario'}>
          Usuario
        </MenuItem>
      </Menu>
    </>
  );
};

export default ChangeUserRole;
