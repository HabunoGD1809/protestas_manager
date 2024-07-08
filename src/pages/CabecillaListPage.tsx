import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CabecillaList from '../components/Cabecilla/CabecillaList';

const CabecillaListPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cabecillas
      </Typography>
      <Button component={RouterLink} to="/cabecillas/new" variant="contained" color="primary" sx={{ mb: 2 }}>
        Crear nuevo Cabecilla
      </Button>
      <CabecillaList />
    </Box>
  );
};

export default CabecillaListPage;
