import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia, Cabecilla } from '../../types/types';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Button, Tooltip, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProtestaFilter, { FilterValues } from './ProtestaFilter';
import { protestaService } from '../../services/apiService';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import CommonTable from '../Common/CommonTable';
import DeleteConfirmationDialog from '../Common/DeleteConfirmationDialog';
import { cacheService } from '../../services/cacheService';
import { logError } from '../../services/loggingService';

const { Title } = Typography;

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<FilterValues>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [protestaToDelete, setProtestaToDelete] = useState<Protesta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchProtestas = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await protestaService.fetchProtestas(page, pageSize, filters);
      setProtestas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total,
      });
    } catch (error) {
      logError('Error fetching protestas', error as Error);
      setError('Error al cargar la lista de protestas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProtestas(pagination.current, pagination.pageSize);
  }, [fetchProtestas, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const fetchNaturalezasYProvincias = async () => {
      try {
        const [naturalezasData, provinciasData] = await protestaService.fetchNaturalezasYProvincias();
        setNaturalezas(naturalezasData);
        setProvincias(provinciasData);
      } catch (error) {
        logError('Error fetching naturalezas and provincias', error as Error);
        setError('Error al cargar naturalezas y provincias');
      }
    };

    fetchNaturalezasYProvincias();
  }, []);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      cacheService.markAllAsStale();
      fetchProtestas(pagination.current, pagination.pageSize);
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [fetchProtestas, pagination]);

  const handleEdit = (protesta: Protesta) => {
    navigate(`/protestas/${protesta.id}`);
  };

  const handleDeleteClick = (protesta: Protesta) => {
    setProtestaToDelete(protesta);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (protestaToDelete) {
      try {
        await protestaService.delete(protestaToDelete.id);
        setProtestas(prevProtestas => prevProtestas.filter(p => p.id !== protestaToDelete.id));
        setDeleteDialogOpen(false);
        setProtestaToDelete(null);
        message.success('Protesta eliminada exitosamente'); //necesita modificacion
      } catch (error) {
        logError('Error deleting protesta', error as Error);
        message.error('Error al eliminar la protesta');
      }
    }
  };

  const handleFilter = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchProtestas(1, pagination.pageSize);
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
    fetchProtestas(page, pageSize);
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

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Naturaleza',
      dataIndex: 'naturaleza_id',
      key: 'naturaleza_id',
      render: (value: string) => {
        const naturaleza = naturalezas.find(n => n.id === value);
        return <span>{naturaleza ? naturaleza.nombre : 'N/A'}</span>;
      },
    },
    {
      title: 'Provincia',
      dataIndex: 'provincia_id',
      key: 'provincia_id',
      render: (value: string) => {
        const provincia = provincias.find(p => p.id === value);
        return <span>{provincia ? provincia.nombre : 'N/A'}</span>;
      },
    },
    {
      title: 'Fecha del Evento',
      dataIndex: 'fecha_evento',
      key: 'fecha_evento',
    },
    {
      title: 'Cabecillas',
      dataIndex: 'cabecillas',
      key: 'cabecillas',
      render: renderCabecillas,
    },
    {
      title: 'Creador',
      dataIndex: 'creador_nombre',
      key: 'creador_nombre',
      render: (value: string, record: Protesta) => (
        <Tooltip title={record.creador_email}>
          <span>{value || 'N/A'}</span>
        </Tooltip>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <Title level={2}>Lista de Protestas</Title>
      <ProtestaFilter
        naturalezas={naturalezas}
        provincias={provincias}
        onFilter={handleFilter}
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate('/protestas/crear')}
        style={{ marginBottom: 16 }}
      >
        Añadir Protesta
      </Button>
      <CommonTable
        data={protestas}
        columns={columns}
        pagination={{
          ...pagination,
          onChange: handlePaginationChange,
        }}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        isAdmin={isAdmin()}
      />
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={protestaToDelete ? protestaToDelete.nombre : ''}
      />
    </div>
  );
};

export default ProtestaList;
