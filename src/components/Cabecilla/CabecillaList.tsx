import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, message, Avatar } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';
import { cabecillaService } from '../../services/api';
import CabecillaFilter, { CabecillaFilterValues } from './CabecillaFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getFullImageUrl } from '../../services/api';
import CommonTable from '../Common/CommonTable';

const { Title } = Typography;

const CabecillaList: React.FC = () => {
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<CabecillaFilterValues>({});
  const { loading, error } = useApi();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

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

  const handleEdit = (cabecilla: Cabecilla) => {
    navigate(`/cabecillas/edit/${cabecilla.id}`);
  };

  const handleDelete = async (cabecilla: Cabecilla) => {
    try {
      await cabecillaService.delete(cabecilla.id);
      setCabecillas(prevCabecillas => prevCabecillas.filter(c => c.id !== cabecilla.id));
      message.success(`Cabecilla ${cabecilla.nombre} ${cabecilla.apellido} eliminado exitosamente`);
    } catch (error) {
      console.error('Error deleting cabecilla:', error);
      message.error('Error al eliminar el cabecilla');
    }
  };

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
        onDelete={handleDelete}
        isAdmin={isAdmin()}
      />
    </div>
  );
};

export default CabecillaList;
