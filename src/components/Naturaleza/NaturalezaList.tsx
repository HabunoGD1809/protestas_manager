import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Box, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types';
import Pagination from '../Common/Pagination';
import { naturalezaService } from '../../services/api';
import NaturalezaFilter from './NaturalezaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import * as Icons from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../hooks/useAuth';

const NaturalezaList: React.FC = () => {
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [naturalezaToDelete, setNaturalezaToDelete] = useState<Naturaleza | null>(null);
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();

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
      // message.success('Lista de naturalezas cargada exitosamente');
    } catch (err) {
      console.error('Error fetching naturalezas:', err);
      message.error('Error al cargar la lista de naturalezas');
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

  const handleDeleteNaturaleza = async () => {
    if (naturalezaToDelete) {
      try {
        await naturalezaService.delete(naturalezaToDelete.id);
        setNaturalezas(prevNaturalezas => prevNaturalezas.filter(n => n.id !== naturalezaToDelete.id));
        setDeleteDialogOpen(false);
        setNaturalezaToDelete(null);
        message.success('Naturaleza eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting naturaleza:', error);
        message.error('Error al eliminar la naturaleza');
      }
    }
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    {
      title: 'Color',
      dataIndex: 'color', key: 'color',
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
        <Box>
          <Button
            component={RouterLink}
            to={`/naturalezas/edit/${naturaleza.id}`}
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Editar
          </Button>
          {isAdmin() && (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setNaturalezaToDelete(naturaleza);
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar esta naturaleza?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteNaturaleza} color="secondary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NaturalezaList;
