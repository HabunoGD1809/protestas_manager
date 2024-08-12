import React from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import NaturalezaForm from '../components/Naturaleza/NaturalezaForm';

const NaturalezaFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Naturaleza' : 'Crear nueva Naturaleza'}
      </Typography>
      <NaturalezaForm />
    </Box>
  );
};

export default NaturalezaFormPage;
