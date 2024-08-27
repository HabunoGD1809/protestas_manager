import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types';
import { naturalezaService } from '../../services/api';
import NaturalezaFilter, { NaturalezaFilters } from './NaturalezaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import CommonTable from '../Common/CommonTable';
import DeleteConfirmationDialog from '../Common/DeleteConfirmationDialog';
import * as IconoirIcons from 'iconoir-react';

const { Title } = Typography;

interface IconoirIconComponent extends React.FC<React.SVGProps<SVGSVGElement>> { }

const NaturalezaList: React.FC = () => {
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<NaturalezaFilters>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [naturalezaToDelete, setNaturalezaToDelete] = useState<Naturaleza | null>(null);
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchNaturalezas = useCallback(async (page: number, pageSize: number, newFilters?: NaturalezaFilters) => {
    try {
      const data = await naturalezaService.getAll(page, pageSize, newFilters || filters);
      setNaturalezas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (err) {
      console.error('Error fetching naturalezas:', err);
      message.error('Error al cargar la lista de naturalezas');
    }
  }, [filters]);

  useEffect(() => {
    fetchNaturalezas(pagination.current, pagination.pageSize);
  }, [fetchNaturalezas, pagination.current, pagination.pageSize]);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    fetchNaturalezas(page, pageSize || pagination.pageSize);
  }, [fetchNaturalezas, pagination.pageSize]);

  const handleFilter = useCallback((newFilters: NaturalezaFilters) => {
    setFilters(newFilters);
    fetchNaturalezas(1, pagination.pageSize, newFilters);
  }, [fetchNaturalezas, pagination.pageSize]);

  const handleEdit = useCallback((naturaleza: Naturaleza) => {
    navigate(`/naturalezas/edit/${naturaleza.id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((naturaleza: Naturaleza) => {
    setNaturalezaToDelete(naturaleza);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (naturalezaToDelete) {
      try {
        await naturalezaService.delete(naturalezaToDelete.id);
        setNaturalezas(prevNaturalezas => prevNaturalezas.filter(n => n.id !== naturalezaToDelete.id));
        setDeleteDialogOpen(false);
        setNaturalezaToDelete(null);
        message.success('Naturaleza eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar la naturaleza:', error);
        message.error('Error al eliminar la naturaleza');
      }
    }
  }, [naturalezaToDelete]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      fetchNaturalezas(pagination.current, pagination.pageSize);
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [fetchNaturalezas, pagination, pagination.pageSize]);

  const columns = [
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div style={{ backgroundColor: color, width: 20, height: 20, borderRadius: '50%' }}></div>
      )
    },
    {
      title: 'Icono',
      dataIndex: 'icono',
      key: 'icono',
      render: (icono: string) => {
        const IconComponent = IconoirIcons[icono as keyof typeof IconoirIcons] as IconoirIconComponent;
        return (
          <Tooltip title={icono}>
            {IconComponent ? (
              <IconComponent style={{ fontSize: '20px' }} />
            ) : (
              <span>{icono}</span>
            )}
          </Tooltip>
        );
      }
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <Title level={2}>Lista de Naturalezas</Title>
      <NaturalezaFilter onFilter={handleFilter} />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate('/naturalezas/new')}
        style={{ marginBottom: 16 }}
      >
        Crear nueva Naturaleza
      </Button>
      <CommonTable
        data={naturalezas}
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
        itemName={naturalezaToDelete ? naturalezaToDelete.nombre : ''}
      />
    </div>
  );
};

export default NaturalezaList;
