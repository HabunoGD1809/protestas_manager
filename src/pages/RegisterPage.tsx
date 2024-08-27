import React from 'react';
import { Typography, Box } from '@mui/material';
import Register from '../components/Auth/Register';

const RegisterPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Registro
      </Typography>
      <Register />
    </Box>
  );
};

export default RegisterPage;
