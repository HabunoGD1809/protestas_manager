import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia, Cabecilla } from '../../types';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import ProtestaFilter from './ProtestaFilter';
import Pagination from '../Common/Pagination';
import { protestaService, naturalezaService, provinciaService } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';

type ColumnDefinition<T> = {
  title: string;
  key: string;
  dataIndex?: keyof T;
  render: (value: any, record: T) => React.ReactNode;
};

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [protestaToDelete, setProtestaToDelete] = useState<Protesta | null>(null);
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();

  const fetchProtestas = useCallback(async (page: number, pageSize: number) => {
    try {
      // console.log('Fetching protestas with filters:', filters); //no borrar
      const data = await protestaService.getAll(page, pageSize, filters);
      // console.log('Protestas data received:', data); // no borrar
      setProtestas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,   
        total: data.total
      });
    } catch (error) {
      console.error('Error fetching protestas:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchProtestas(pagination.current, pagination.pageSize);
  }, [fetchProtestas, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const fetchNaturalezas = async () => {
      try {
        const data = await naturalezaService.getAll();
        setNaturalezas(data.items);
      } catch (error) {
        console.error('Error fetching naturalezas:', error);
      }
    };

    const fetchProvincias = async () => {
      try {
        const data = await provinciaService.getAll();
        setProvincias(data);
      } catch (error) {
        console.error('Error fetching provincias:', error);
      }
    };

    fetchNaturalezas();
    fetchProvincias();
  }, []);

  const handleDeleteProtesta = async () => {
    if (protestaToDelete) {
      try {
        await protestaService.delete(protestaToDelete.id);
        setProtestas(prevProtestas => prevProtestas.filter(p => p.id !== protestaToDelete.id));
        setDeleteDialogOpen(false);
        setProtestaToDelete(null);
      } catch (error) {
        console.error('Error deleting protesta:', error);
      }
    }
  };

  const handleFilter = (newFilters: Record<string, string>) => {
    console.log('New filters:', newFilters);
    setFilters(newFilters);
    fetchProtestas(1, pagination.pageSize);
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchProtestas(page, pageSize || pagination.pageSize);
  };

  const renderCabecillas = (cabecillas: Cabecilla[]): React.ReactNode => {
    if (cabecillas.length === 0) return <span>Ninguno</span>;
    const names = cabecillas.map(c => `${c.nombre} ${c.apellido}`).join(', ');
    return (
      <Tooltip title={names}>
        <span>{`${cabecillas.length} cabecilla${cabecillas.length > 1 ? 's' : ''}`}</span>
      </Tooltip>
    );
  };

  const columns: ColumnDefinition<Protesta>[] = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (value: string) => <span>{value}</span>,
    },
    {
      title: 'Naturaleza',
      dataIndex: 'naturaleza_id',
      key: 'naturaleza_id',
      render: (naturalezaId: string) => {
        const naturaleza = naturalezas.find(n => n.id === naturalezaId);
        return <span>{naturaleza ? naturaleza.nombre : 'N/A'}</span>;
      },
    },
    {
      title: 'Provincia',
      dataIndex: 'provincia_id',
      key: 'provincia_id',
      render: (provinciaId: string) => {
        const provincia = provincias.find(p => p.id === provinciaId);
        return <span>{provincia ? provincia.nombre : 'N/A'}</span>;
      },
    },
    {
      title: 'Fecha del Evento',
      dataIndex: 'fecha_evento',
      key: 'fecha_evento',
      render: (value: string) => <span>{value}</span>,
    },
    {
      title: 'Cabecillas',
      dataIndex: 'cabecillas',
      key: 'cabecillas',
      render: (cabecillas: Cabecilla[]) => renderCabecillas(cabecillas),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, protesta: Protesta) => (
        <Box>
          <Button
            component={RouterLink}
            to={`/protestas/${protesta.id}`}
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
                setProtestaToDelete(protesta);
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
      <Typography variant="h4" gutterBottom>Lista de Protestas</Typography>
      <ProtestaFilter 
        naturalezas={naturalezas}
        provincias={provincias}
        onFilter={handleFilter}
      />
      <Button 
        component={RouterLink}
        to="/protestas/crear"
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        sx={{ mb: 2, mt: 2 }}
      >
        Añadir Protesta
      </Button>
      {protestas.length > 0 ? (
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
              {protestas.map((protesta) => (
                <TableRow key={protesta.id}>
                  {columns.map((column) => (
                    <TableCell key={`${protesta.id}-${column.key}`}>
                      {column.render(
                        column.dataIndex ? protesta[column.dataIndex] : undefined, 
                        protesta
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1">No hay protestas para mostrar.</Typography>
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
            ¿Estás seguro de que quieres eliminar esta protesta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteProtesta} color="secondary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProtestaList;
