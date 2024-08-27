import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message, Avatar } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types/types';
import { cabecillaService } from '../../services/apiService';
import CabecillaFilter, { CabecillaFilterValues } from './CabecillaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getFullImageUrl } from '../../services/apiService';
import CommonTable from '../Common/CommonTable';
import DeleteConfirmationDialog from '../Common/DeleteConfirmationDialog';

const { Title } = Typography;

const CabecillaList: React.FC = () => {
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<CabecillaFilterValues>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cabecillaToDelete, setCabecillaToDelete] = useState<Cabecilla | null>(null);
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchCabecillas = useCallback(async (page: number, pageSize: number, newFilters?: CabecillaFilterValues) => {
    try {
      const filterRecord: Record<string, string> = Object.entries(newFilters || filters).reduce((acc, [key, value]) => {
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
  }, [filters]);

  useEffect(() => {
    fetchCabecillas(pagination.current, pagination.pageSize);
  }, [fetchCabecillas, pagination.current, pagination.pageSize]);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    fetchCabecillas(page, pageSize || pagination.pageSize);
  }, [fetchCabecillas, pagination.pageSize]);

  const handleFilter = useCallback((newFilters: CabecillaFilterValues) => {
    setFilters(newFilters);
    fetchCabecillas(1, pagination.pageSize, newFilters);
  }, [fetchCabecillas, pagination.pageSize]);

  const handleEdit = useCallback((cabecilla: Cabecilla) => {
    navigate(`/cabecillas/edit/${cabecilla.id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((cabecilla: Cabecilla) => {
    setCabecillaToDelete(cabecilla);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (cabecillaToDelete) {
      try {
        await cabecillaService.delete(cabecillaToDelete.id);
        setCabecillas(prevCabecillas => prevCabecillas.filter(c => c.id !== cabecillaToDelete.id));
        setDeleteDialogOpen(false);
        setCabecillaToDelete(null);
        message.success('Cabecilla eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar el cabecilla:', error);
        message.error('Error al eliminar el cabecilla');
      }
    }
  }, [cabecillaToDelete]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      fetchCabecillas(pagination.current, pagination.pageSize);
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [fetchCabecillas, pagination, pagination.pageSize]);

  const columns = [
    {
      title: 'Foto',
      dataIndex: 'foto',
      key: 'foto',
      render: (foto: string, cabecilla: Cabecilla) => (
        <Avatar src={getFullImageUrl(foto) || undefined} alt={`${cabecilla.nombre} ${cabecilla.apellido}`} />
      ),
    },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Apellido', dataIndex: 'apellido', key: 'apellido' },
    { title: 'Cédula', dataIndex: 'cedula', key: 'cedula' },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <Title level={2}>Lista de Cabecillas</Title>
      <CabecillaFilter onFilter={handleFilter} />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate('/cabecillas/new')}
        style={{ marginBottom: 16 }}
      >
        Crear nuevo Cabecilla
      </Button>
      <CommonTable
        data={cabecillas}
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
        itemName={cabecillaToDelete ? `${cabecillaToDelete.nombre} ${cabecillaToDelete.apellido}` : ''}
      />
    </div>
  );
};

export default CabecillaList;
