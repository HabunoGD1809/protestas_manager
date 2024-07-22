import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Box, Typography } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types';
import Pagination from '../Common/Pagination';
import { naturalezaService } from '../../services/api';
import NaturalezaFilter from './NaturalezaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import * as Icons from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';

const NaturalezaList: React.FC = () => {
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { loading, error } = useApi();

  const fetchNaturalezas = async (page: number, pageSize: number) => {
    try {
      const data = await naturalezaService.getAll(page, pageSize, filters);
      console.log('Datos recibidos:', data);
      setNaturalezas(data.items || []);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (err) {
      console.error('Error fetching naturalezas:', err);
    }
  };

  useEffect(() => {
    fetchNaturalezas(pagination.current, pagination.pageSize);
  }, [filters]);

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchNaturalezas(page, pageSize || pagination.pageSize);
  };

  const handleFilter = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    fetchNaturalezas(1, pagination.pageSize);
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { 
      title: 'Color', 
      dataIndex: 'color', 
      key: 'color',
      render: (naturaleza: Naturaleza) => (
        <div style={{ backgroundColor: naturaleza.color, width: 20, height: 20, borderRadius: '50%' }}></div>
      )
    },
    { 
      title: 'Icono', 
      dataIndex: 'icono', 
      key: 'icono',
      render: (naturaleza: Naturaleza) => {
        const IconComponent = Icons[naturaleza.icono as keyof typeof Icons];
        return IconComponent ? <IconButton><IconComponent /></IconButton> : null;
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (naturaleza: Naturaleza) => (
        naturaleza.id ? (
          <Button 
            component={RouterLink} 
            to={`/naturalezas/edit/${naturaleza.id}`} 
            variant="outlined" 
            size="small"
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
        ) : null
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Lista de Naturalezas</Typography>
      <NaturalezaFilter onFilter={handleFilter} />
      <Button 
        component={RouterLink} 
        to="/naturalezas/new" 
        variant="contained" 
        color="primary" 
        sx={{ mb: 2, mt: 2 }}
      >
        Crear nueva Naturaleza
      </Button>
      {naturalezas.length > 0 ? (
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
              {naturalezas.map((naturaleza) => (
                <TableRow key={naturaleza.id}>
                  {columns.map((column) => (
                    <TableCell key={`${naturaleza.id}-${column.key}`}>
                      {column.render 
                        ? column.render(naturaleza)
                        : naturaleza[column.dataIndex as keyof Naturaleza]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1">No hay naturalezas para mostrar.</Typography>
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

export default NaturalezaList;
