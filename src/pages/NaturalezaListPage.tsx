import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NaturalezaList from '../components/Naturaleza/NaturalezaList';

const NaturalezaListPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Naturalezas
      </Typography>
      <Button component={RouterLink} to="/naturalezas/new" variant="contained" color="primary" sx={{ mb: 2 }}>
        Create New Naturaleza
      </Button>
      <NaturalezaList />
    </Box>
  );
};

export default NaturalezaListPage;
