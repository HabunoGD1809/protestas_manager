import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Box, List, ListItem, ListItemText } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Protesta, Naturaleza, Provincia } from '../../types';

const ProtestaDetail: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | null>(null);
  const [naturaleza, setNaturaleza] = useState<Naturaleza | null>(null);
  const [provincia, setProvincia] = useState<Provincia | null>(null);
  const { request } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const protestaData = await request<Protesta>('get', `/protestas/${id}`);
        setProtesta(protestaData);

        const [naturalezaData, provinciaData] = await Promise.all([
          request<Naturaleza>('get', `/naturalezas/${protestaData.naturaleza_id}`),
          request<Provincia>('get', `/provincias/${protestaData.provincia_id}`)
        ]);
        setNaturaleza(naturalezaData);
        setProvincia(provinciaData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [id, request]);

  const handleDelete = async () => {
    try {
      await request('delete', `/protestas/${id}`);
      navigate('/protestas');
    } catch (err) {
      console.error('Error deleting protesta:', err);
    }
  };

  if (!protesta || !naturaleza || !provincia) return <div>Loading...</div>;

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
        Naturaleza: {naturaleza.nombre}
      </Typography>
      <Typography variant="body2">
        Provincia: {provincia.nombre}
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
