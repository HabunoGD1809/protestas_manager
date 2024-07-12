import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia } from '../../types';
import { useApi } from '../../hooks/useApi';
import { Card, Descriptions, Button, Space, message, Tag, Avatar, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const ProtestaDetail: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | null>(null);
  const [naturaleza, setNaturaleza] = useState<Naturaleza | null>(null);
  const [provincia, setProvincia] = useState<Provincia | null>(null);
  const { request, loading, error } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fetchProtesta = useCallback(async (protestaId: string) => {
    try {
      const data = await request<Protesta>('get', `/protestas/${protestaId}`);
      setProtesta(data);
      fetchNaturaleza(data.naturaleza_id);
      fetchProvincia(data.provincia_id);
    } catch (error) {
      message.error('Error al cargar los detalles de la protesta');
    }
  }, [request]);

  useEffect(() => {
    if (id) {
      fetchProtesta(id);
    }
  }, [id, fetchProtesta]);

  const fetchNaturaleza = async (naturalezaId: string) => {
    try {
      const data = await request<Naturaleza>('get', `/naturalezas/${naturalezaId}`);
      setNaturaleza(data);
    } catch (error) {
      message.error('Error al cargar los detalles de la naturaleza');
    }
  };

  const fetchProvincia = async (provinciaId: string) => {
    try {
      const data = await request<Provincia>('get', `/provincias/${provinciaId}`);
      setProvincia(data);
    } catch (error) {
      message.error('Error al cargar los detalles de la provincia');
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
            <Tag color={naturaleza.color} icon={naturaleza.icono && <span className={naturaleza.icono} />}>
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
        {protesta.cabecillas.map(c => (
          <Descriptions.Item key={c.id}>
            <Space>
              <Avatar src={c.foto} />
              {`${c.nombre} ${c.apellido}`}
            </Space>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
};

export default ProtestaDetail;
