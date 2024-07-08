import React from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import ProtestaForm from '../components/Protesta/ProtestaForm';

const ProtestaFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit Protesta' : 'Crear nueva Protesta'}
      </Typography>
      <ProtestaForm />
    </Box>
  );
};

export default ProtestaFormPage;
