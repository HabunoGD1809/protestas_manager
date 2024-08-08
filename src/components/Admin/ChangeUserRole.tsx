import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { userService } from '../../services/api';
import axios from 'axios';

interface ChangeUserRoleProps {
  userId: string;
  currentRole: 'admin' | 'usuario';
  onRoleChange: (newRole: 'admin' | 'usuario') => void;
}

const ChangeUserRole: React.FC<ChangeUserRoleProps> = ({ userId, currentRole, onRoleChange }) => {
const handleRoleChange = async (event: SelectChangeEvent<'admin' | 'usuario'>) => {
  const newRole = event.target.value as 'admin' | 'usuario';
  try {
    await userService.updateRole(userId, newRole);
    onRoleChange(newRole);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error al cambiar el rol del usuario:', error.response.data);
      // Aquí puedes mostrar un mensaje de error al usuario
    } else {
      console.error('Error al cambiar el rol del usuario:', error);
    }
  }
};

  return (
    <FormControl fullWidth>
      <InputLabel id={`role-select-label-${userId}`}>Rol</InputLabel>
      <Select
        labelId={`role-select-label-${userId}`}
        value={currentRole}
        label="Rol"
        onChange={handleRoleChange}
      >
        <MenuItem value="usuario">Usuario</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </Select>
    </FormControl>
  );
};

export default ChangeUserRole;
