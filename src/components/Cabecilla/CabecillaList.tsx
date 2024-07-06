import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';

const CabecillaList: React.FC = () => {
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchCabecillas = async () => {
      try {
        const data = await request('get', '/cabecillas');
        setCabecillas(data);
      } catch (err) {
        console.error('Error fetching cabecillas:', err);
      }
    };
    fetchCabecillas();
  }, [request]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Apellido</TableCell>
            <TableCell>Cédula</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cabecillas.map((cabecilla) => (
            <TableRow key={cabecilla.id}>
            <TableCell>{cabecilla.nombre}</TableCell>
              <TableCell>{cabecilla.apellido}</TableCell>
              <TableCell>{cabecilla.cedula}</TableCell>
              <TableCell>
                <Button component={RouterLink} to={`/cabecillas/edit/${cabecilla.id}`}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CabecillaList;
