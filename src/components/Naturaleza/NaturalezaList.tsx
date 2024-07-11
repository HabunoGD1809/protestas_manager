import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types';
import * as Icons from '@mui/icons-material';

const NaturalezaList: React.FC = () => {
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchNaturalezas = async () => {
      try {
        const data = await request<Naturaleza[]>('get', '/naturalezas');
        setNaturalezas(data);
      } catch (err) {
        console.error('Error fetching naturalezas:', err);
      }
    };
    fetchNaturalezas();
  }, [request]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Color</TableCell>
            <TableCell>Icono</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {naturalezas.map((naturaleza) => {
            const IconComponent = Icons[naturaleza.icono as keyof typeof Icons];
            return (
              <TableRow key={naturaleza.id}>
                <TableCell>{naturaleza.nombre}</TableCell>
                <TableCell>
                  <div style={{ backgroundColor: naturaleza.color, width: 20, height: 20 }}></div>
                </TableCell>
                <TableCell>
                  {IconComponent && (
                    <IconButton>
                      <IconComponent />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>
                  <Button component={RouterLink} to={`/naturalezas/edit/${naturaleza.id}`}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NaturalezaList;
