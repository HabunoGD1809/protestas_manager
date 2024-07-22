import React from 'react';
import { Typography, Box } from '@mui/material';
import UserList from '../components/Admin/UserList';

const UserListPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lista de Usuarios
      </Typography>
      <UserList />
    </Box>
  );
};

export default UserListPage;
