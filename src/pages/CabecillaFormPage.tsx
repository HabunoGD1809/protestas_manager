import React from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import CabecillaForm from '../components/Cabecilla/CabecillaForm';

const CabecillaFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Cabecilla' : 'Crear nuevo Cabecilla'}
      </Typography>
      <CabecillaForm />
    </Box>
  );
};

export default CabecillaFormPage;
