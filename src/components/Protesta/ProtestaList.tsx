import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Protesta } from '../../types';

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchProtestas = async () => {
      try {
        const data = await request('get', '/protestas');
        setProtestas(data);
      } catch (err) {
        console.error('Error fetching protestas:', err);
      }
    };
    fetchProtestas();
  }, [request]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Naturaleza</TableCell>
            <TableCell>Provincia</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {protestas.map((protesta) => (
            <TableRow key={protesta.id}>
              <TableCell>{protesta.nombre}</TableCell>
              <TableCell>{new Date(protesta.fecha_evento).toLocaleDateString()}</TableCell>
              <TableCell>{protesta.naturaleza.nombre}</TableCell>
              <TableCell>{protesta.provincia.nombre}</TableCell>
              <TableCell>
                <Button component={RouterLink} to={`/protestas/${protesta.id}`}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProtestaList;
