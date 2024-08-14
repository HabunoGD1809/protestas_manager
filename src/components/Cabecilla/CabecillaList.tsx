import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, Box, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';
import Pagination from '../Common/Pagination';
import { cabecillaService } from '../../services/api';
import CabecillaFilter, { CabecillaFilterValues } from './CabecillaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getFullImageUrl } from '../../services/api';

const CabecillaList: React.FC = () => {
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<CabecillaFilterValues>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cabecillaToDelete, setCabecillaToDelete] = useState<Cabecilla | null>(null);
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();

  const fetchCabecillas = async (page: number, pageSize: number) => {
    try {
      const filterRecord: Record<string, string> = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>);

      const data = await cabecillaService.getAll(page, pageSize, filterRecord);
      setCabecillas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (err) {
      console.error('Error fetching cabecillas:', err);
      message.error('Error al cargar la lista de cabecillas');
    }
  };

  useEffect(() => {
    fetchCabecillas(pagination.current, pagination.pageSize);
  }, [filters]);

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchCabecillas(page, pageSize || pagination.pageSize);
  };

  const handleFilter = (newFilters: CabecillaFilterValues) => { 
    setFilters(newFilters);
    fetchCabecillas(1, pagination.pageSize);
  };

  const handleDeleteCabecilla = async () => {
    if (cabecillaToDelete) {
      try {
        await cabecillaService.delete(cabecillaToDelete.id);
        setCabecillas(prevCabecillas => prevCabecillas.filter(c => c.id !== cabecillaToDelete.id));
        setDeleteDialogOpen(false);
        setCabecillaToDelete(null);
        message.success(`Cabecilla ${cabecillaToDelete.nombre} ${cabecillaToDelete.apellido} eliminado exitosamente`);
      } catch (error) {
        console.error('Error deleting cabecilla:', error);
        message.error('Error al eliminar el cabecilla');
      }
    }
  };

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (cabecilla: Cabecilla) => (
        <Avatar src={getFullImageUrl(cabecilla.foto) || undefined} alt={`${cabecilla.nombre} ${cabecilla.apellido}`} />
      ),
    },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Apellido', dataIndex: 'apellido', key: 'apellido' },
    { title: 'Cédula', dataIndex: 'cedula', key: 'cedula' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (cabecilla: Cabecilla) => (
        <Box>
          <Button component={RouterLink} to={`/cabecillas/edit/${cabecilla.id}`} variant="outlined" size="small" sx={{ mr: 1 }}>
            Editar
          </Button>
          {isAdmin() && (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => {
                setCabecillaToDelete(cabecilla);
                setDeleteDialogOpen(true);
              }}
            >
              Eliminar
            </Button>
          )}
        </Box>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar a este cabecilla?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteCabecilla} color="secondary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CabecillaList;
