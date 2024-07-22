import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia } from '../../types';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button, Table, Space, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ProtestaFilter from './ProtestaFilter';
import Pagination from '../Common/Pagination';
import { protestaService, naturalezaService, provinciaService } from '../../services/api';

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { loading, error } = useApi();
  const navigate = useNavigate();

    const { isAdmin } = useAuth();

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
      message.error('Error al cargar las protestas');
    }
  }, [filters]);

  useEffect(() => {
    fetchProtestas(pagination.current, pagination.pageSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProtestas, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchNaturalezas();
    fetchProvincias();
  }, []);

  const fetchNaturalezas = async () => {
    try {
      const data = await naturalezaService.getAll();
      setNaturalezas(data);
    } catch (error) {
      console.error('Error fetching naturalezas:', error);
      message.error('Error al cargar las naturalezas');
    }
  };

  const fetchProvincias = async () => {
    try {
      const data = await provinciaService.getAll();
      setProvincias(data);
    } catch (error) {
      console.error('Error fetching provincias:', error);
      message.error('Error al cargar las provincias');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '¿Estás seguro de que quieres eliminar esta protesta?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await protestaService.delete(id);
          message.success('Protesta eliminada con éxito');
          fetchProtestas(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error('Error deleting protesta:', error);
          message.error('Error al eliminar la protesta');
        }
      },
    });
  };

  const handleFilter = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    fetchProtestas(1, pagination.pageSize);
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchProtestas(page, pageSize || pagination.pageSize);
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
      render: (naturalezaId: string) => {
        const naturaleza = naturalezas.find(n => n.id === naturalezaId);
        return naturaleza ? naturaleza.nombre : 'N/A';
      },
    },
    {
      title: 'Provincia',
      dataIndex: 'provincia_id',
      key: 'provincia_id',
      render: (provinciaId: string) => {
        const provincia = provincias.find(p => p.id === provinciaId);
        return provincia ? provincia.nombre : 'N/A';
      },
    },
    {
      title: 'Fecha del Evento',
      dataIndex: 'fecha_evento',
      key: 'fecha_evento',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: Protesta) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/protestas/${record.id}`)}
          >
            Editar
          </Button>
          {isAdmin() && (
            <Button 
              icon={<DeleteOutlined />} 
              danger
              onClick={() => handleDelete(record.id)}
            >
              Eliminar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>Lista de Protestas</h1>
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
      <Table 
        columns={columns} 
        dataSource={protestas} 
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Pagination
        current={pagination.current}
        total={pagination.total}
        pageSize={pagination.pageSize}
        onChange={handlePaginationChange}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ProtestaList;
