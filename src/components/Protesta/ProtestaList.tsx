import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Protesta, Naturaleza, Provincia } from '../../types';

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<{[key: string]: Naturaleza}>({});
  const [provincias, setProvincias] = useState<{[key: string]: Provincia}>({});
  const { request, loading, error } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [protestasData, naturalezasData, provinciasData] = await Promise.all([
          request<Protesta[]>('get', '/protestas'),
          request<Naturaleza[]>('get', '/naturalezas'),
          request<Provincia[]>('get', '/provincias')
        ]);
        setProtestas(protestasData);
        setNaturalezas(naturalezasData.reduce((acc, nat) => ({...acc, [nat.id]: nat}), {}));
        setProvincias(provinciasData.reduce((acc, prov) => ({...acc, [prov.id]: prov}), {}));
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
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
              <TableCell>{naturalezas[protesta.naturaleza_id]?.nombre}</TableCell>
              <TableCell>{provincias[protesta.provincia_id]?.nombre}</TableCell>
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
