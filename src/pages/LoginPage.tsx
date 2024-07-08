import React from 'react';
import { Typography, Box } from '@mui/material';
import Login from '../components/Auth/Login';

const LoginPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Iniciar sesión      </Typography>
      <Login />
    </Box>
  );
};

export default LoginPage;
