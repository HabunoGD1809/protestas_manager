import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message, Tooltip, Modal } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types/types';
import { naturalezaService } from '../../services/apiService';
import NaturalezaFilter, { NaturalezaFilters } from './NaturalezaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import CommonTable from '../Common/CommonTable';
import * as IconoirIcons from 'iconoir-react';

const { Title } = Typography;
const { confirm } = Modal;

interface IconoirIconComponent extends React.FC<React.SVGProps<SVGSVGElement>> { }

interface ApiError {
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
}

const NaturalezaList: React.FC = () => {
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<NaturalezaFilters>({});
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
    confirm({
      title: '¿Estás seguro de que quieres eliminar esta naturaleza?',
      icon: <ExclamationCircleOutlined />,
      content: `Se eliminará la naturaleza "${naturaleza.nombre}"`,
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await naturalezaService.delete(naturaleza.id);
          setNaturalezas(prevNaturalezas => prevNaturalezas.filter(n => n.id !== naturaleza.id));
          message.success('Naturaleza eliminada exitosamente');
        } catch (error) {
          console.error('Error al eliminar la naturaleza:', error);
          const apiError = error as ApiError;
          if (apiError.response?.status === 400 && apiError.response.data?.detail) {
            message.error(
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {`Error al eliminar la naturaleza:\n${apiError.response.data.detail}`}
              </div>
            );
          } else {
            message.error('Error al eliminar la naturaleza');
          }
        }
      },
    });
  }, []);

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
        editIcon="edit"  
        editTooltip="Editar" 
      />
    </div>
  );
};

export default NaturalezaList;
