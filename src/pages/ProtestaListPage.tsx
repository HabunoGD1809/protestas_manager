import React from 'react';
import { Typography, Button, Box, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ProtestaList from '../components/Protesta/ProtestaList';

const ProtestaListPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Protestas
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button component={RouterLink} to="/protestas/new" variant="contained" color="primary">
          Crear nueva Protesta
        </Button>
      </Box>
      <Card>
        <CardContent>
          <ProtestaList />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProtestaListPage;
