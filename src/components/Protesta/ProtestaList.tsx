import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia, Cabecilla, PaginatedResponse } from '../../types';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Typography, Button, Tooltip, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ProtestaFilter, { FilterValues } from './ProtestaFilter';
import { protestaService } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import CommonTable from '../Common/CommonTable';

const { Title } = Typography;

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<FilterValues>({});
  const { loading, error, request } = useApi();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchProtestas = useCallback(async (page: number, pageSize: number) => {
    try {
      const data = await protestaService.getAll(page, pageSize, filters);
      setProtestas(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (error) {
      console.error('Error fetching protestas:', error);
      message.error('Error al cargar la lista de protestas');
    }
  }, [filters]);

  useEffect(() => {
    fetchProtestas(pagination.current, pagination.pageSize);
  }, [fetchProtestas, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const fetchNaturalezas = async () => {
      try {
        const data = await request<PaginatedResponse<Naturaleza>>('get', '/naturalezas');
        setNaturalezas(data.items);
      } catch (error) {
        console.error('Error fetching naturalezas:', error);
      }
    };

    const fetchProvincias = async () => {
      try {
        const data = await request<Provincia[]>('get', '/provincias');
        setProvincias(data);
      } catch (error) {
        console.error('Error fetching provincias:', error);
      }
    };

    fetchNaturalezas();
    fetchProvincias();
  }, [request]);

  const handleEdit = (protesta: Protesta) => {
    navigate(`/protestas/${protesta.id}`);
  };

  const handleDelete = async (protesta: Protesta) => {
    try {
      await protestaService.delete(protesta.id);
      setProtestas(prevProtestas => prevProtestas.filter(p => p.id !== protesta.id));
      message.success('Protesta eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting protesta:', error);
      message.error('Error al eliminar la protesta');
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
        onDelete={handleDelete}
        isAdmin={isAdmin()}
      />
    </div>
  );
};

export default ProtestaList;
