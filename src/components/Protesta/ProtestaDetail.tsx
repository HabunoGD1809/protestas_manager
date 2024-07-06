import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Box, List, ListItem, ListItemText } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Protesta } from '../../types';

const ProtestaDetail: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | null>(null);
  const { request } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProtesta = async () => {
      try {
        const data = await request('get', `/protestas/${id}`);
        setProtesta(data);
      } catch (err) {
        console.error('Error fetching protesta:', err);
      }
    };
    fetchProtesta();
  }, [id, request]);

  const handleDelete = async () => {
    try {
      await request('delete', `/protestas/${id}`);
      navigate('/protestas');
    } catch (err) {
      console.error('Error deleting protesta:', err);
    }
  };

  if (!protesta) return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {protesta.nombre}
      </Typography>
      <Typography variant="body1" paragraph>
        {protesta.resumen}
      </Typography>
      <Typography variant="body2">
        Date: {new Date(protesta.fecha_evento).toLocaleDateString()}
      </Typography>
      <Typography variant="body2">
        Naturaleza: {protesta.naturaleza.nombre}
      </Typography>
      <Typography variant="body2">
        Provincia: {protesta.provincia.nombre}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Cabecillas:
      </Typography>
      <List>
        {protesta.cabecillas.map((cabecilla) => (
          <ListItem key={cabecilla.id}>
            <ListItemText primary={`${cabecilla.nombre} ${cabecilla.apellido}`} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={() => navigate(`/protestas/edit/${id}`)}>
          Edit
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete} sx={{ ml: 2 }}>
          Delete
        </Button>
      </Box>
    </Box>
  );
};

export default ProtestaDetail;
