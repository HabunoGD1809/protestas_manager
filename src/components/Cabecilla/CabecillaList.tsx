import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, Box, Typography } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';
import Pagination from '../Common/Pagination';
import { cabecillaService } from '../../services/api';
import CabecillaFilter from './CabecillaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

const CabecillaList: React.FC = () => {
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { loading, error } = useApi();

  const fetchCabecillas = async (page: number, pageSize: number) => {
    try {
      const data = await cabecillaService.getAll(page, pageSize, filters);
      setCabecillas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (err) {
      console.error('Error fetching cabecillas:', err);
    }
  };

  useEffect(() => {
    fetchCabecillas(pagination.current, pagination.pageSize);
  }, [filters]);

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchCabecillas(page, pageSize || pagination.pageSize);
  };

  const handleFilter = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    fetchCabecillas(1, pagination.pageSize);
  };

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (cabecilla: Cabecilla) => (
        <Avatar src={cabecilla.foto || undefined} alt={`${cabecilla.nombre} ${cabecilla.apellido}`} />
      ),
    },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Apellido', dataIndex: 'apellido', key: 'apellido' },
    { title: 'Cédula', dataIndex: 'cedula', key: 'cedula' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (cabecilla: Cabecilla) => (
        <Button component={RouterLink} to={`/cabecillas/edit/${cabecilla.id}`} variant="outlined" size="small">
          Editar
        </Button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Lista de Cabecillas</Typography>
      <CabecillaFilter onFilter={handleFilter} />
      <Button 
        component={RouterLink} 
        to="/cabecillas/new" 
        variant="contained" 
        color="primary" 
        sx={{ mb: 2, mt: 2 }}
      >
        Crear nuevo Cabecilla
      </Button>
      {cabecillas.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.title}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cabecillas.map((cabecilla) => (
                <TableRow key={cabecilla.id}>
                  {columns.map((column) => (
                    <TableCell key={`${cabecilla.id}-${column.key}`}>
                      {column.render ? column.render(cabecilla) : cabecilla[column.dataIndex as keyof Cabecilla]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1">No hay cabecillas para mostrar.</Typography>
      )}
      <Pagination
        current={pagination.current}
        total={pagination.total}
        pageSize={pagination.pageSize}
        onChange={handlePaginationChange}
      />
    </Box>
  );
};

export default CabecillaList;
