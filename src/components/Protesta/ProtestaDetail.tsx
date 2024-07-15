import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia } from '../../types';
import { useApi } from '../../hooks/useApi';
import { Card, Descriptions, Button, Space, message, Tag, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import CustomAvatar from '../Common/CustomAvatar';

const ProtestaDetail: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | null>(null);
  const [naturaleza, setNaturaleza] = useState<Naturaleza | null>(null);
  const [provincia, setProvincia] = useState<Provincia | null>(null);
  const { request, loading, error } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fetchProtesta = useCallback(async (protestaId: string) => {
    if (protestaId === 'crear') {
      navigate('/protestas/crear');
      return;
    }
    try {
      const data = await request<Protesta>('get', `/protestas/${protestaId}`);
      setProtesta(data);
      if (data.naturaleza_id) {
        fetchNaturaleza(data.naturaleza_id);
      }
      if (data.provincia_id) {
        fetchProvincia(data.provincia_id);
      }
    } catch (error) {
      console.error('Error al cargar los detalles de la protesta:', error);
      message.error('Error al cargar los detalles de la protesta');
    }
  }, [request, navigate]);

  useEffect(() => {
    if (id && id !== 'crear') {
      fetchProtesta(id);
    }
  }, [id, fetchProtesta]);

  const fetchNaturaleza = async (naturalezaId: string) => {
    try {
      const data = await request<Naturaleza>('get', `/naturalezas/${naturalezaId}`);
      setNaturaleza(data);
    } catch (error) {
      console.error('Error al cargar los detalles de la naturaleza:', error);
    }
  };

  const fetchProvincia = async (provinciaId: string) => {
    try {
      const data = await request<Provincia>('get', `/provincias/${provinciaId}`);
      setProvincia(data);
    } catch (error) {
      console.error('Error al cargar los detalles de la provincia:', error);
    }
  };

  const handleDelete = () => {
    if (id) {
      Modal.confirm({
        title: '¿Estás seguro de que quieres eliminar esta protesta?',
        icon: <ExclamationCircleOutlined />,
        content: 'Esta acción no se puede deshacer.',
        okText: 'Sí',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          try {
            await request('delete', `/protestas/${id}`);
            message.success('Protesta eliminada con éxito');
            navigate('/protestas');
          } catch (error) {
            console.error('Error al eliminar la protesta:', error);
            message.error('Error al eliminar la protesta');
          }
        },
      });
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!protesta) return <p>No se encontró la protesta</p>;

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/protestas')}>
            Volver
          </Button>
          {protesta.nombre}
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/protestas/editar/${id}`)}
          >
            Editar
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </Space>
      }
    >
      <Descriptions column={2}>
        <Descriptions.Item label="Naturaleza">
          {naturaleza && (
            <Tag color={naturaleza.color}>
              {naturaleza.nombre}
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Provincia">{provincia?.nombre}</Descriptions.Item>
        <Descriptions.Item label="Fecha del Evento">{protesta.fecha_evento}</Descriptions.Item>
        <Descriptions.Item label="Fecha de Creación">{protesta.fecha_creacion}</Descriptions.Item>
      </Descriptions>
      <Descriptions column={1}>
        <Descriptions.Item label="Resumen">{protesta.resumen}</Descriptions.Item>
      </Descriptions>
      <Descriptions title="Cabecillas" column={1}>
        {protesta.cabecillas && protesta.cabecillas.map(c => (
          <Descriptions.Item key={c.id}>
            <Space>
              <CustomAvatar src={c.foto} alt={`${c.nombre} ${c.apellido}`} />
              {`${c.nombre} ${c.apellido}`}
            </Space>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
};

export default ProtestaDetail;
