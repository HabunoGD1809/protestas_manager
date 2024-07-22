import React from 'react';
import { Select, message } from 'antd';
import { useApi } from '../../hooks/useApi';

const { Option } = Select;

interface ChangeUserRoleProps {
  userId: string;
  currentRole: 'admin' | 'usuario';
  onRoleChange: (newRole: 'admin' | 'usuario') => void;
}

const ChangeUserRole: React.FC<ChangeUserRoleProps> = ({ userId, currentRole, onRoleChange }) => {
  const { request } = useApi();

  const handleRoleChange = async (newRole: 'admin' | 'usuario') => {
    try {
      await request('put', `/usuarios/${userId}/rol`, { nuevo_rol: newRole });
      message.success('Rol de usuario actualizado con éxito');
      onRoleChange(newRole);
    } catch (error) {
      console.error('Error al cambiar el rol del usuario:', error);
      message.error('Error al cambiar el rol del usuario');
    }
  };

  return (
    <Select
      defaultValue={currentRole}
      style={{ width: 120 }}
      onChange={handleRoleChange}
    >
      <Option value="usuario">Usuario</Option>
      <Option value="admin">Admin</Option>
    </Select>
  );
};

export default ChangeUserRole;
