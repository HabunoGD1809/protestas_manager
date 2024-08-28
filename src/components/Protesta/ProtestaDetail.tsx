import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia } from '../../types/types';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Card, Descriptions, Button, Space, message, Tag, Modal, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, ExclamationCircleOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { getFullImageUrl } from '../../services/apiService';
import { cacheService } from '../../services/cacheService';

const ProtestaDetail: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | null>(null);
  const [naturaleza, setNaturaleza] = useState<Naturaleza | null>(null);
  const [provincia, setProvincia] = useState<Provincia | null>(null);
  const { request, loading, error } = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchProtesta = useCallback(async (protestaId: string) => {
    if (protestaId === 'crear') {
      navigate('/protestas/crear');
      return;
    }
    const cacheKey = `protesta_${protestaId}`;
    const cachedProtesta = cacheService.get<Protesta>(cacheKey);

    if (cachedProtesta) {
      setProtesta(cachedProtesta);
      if (cachedProtesta.naturaleza_id) {
        fetchNaturaleza(cachedProtesta.naturaleza_id);
      }
      if (cachedProtesta.provincia_id) {
        fetchProvincia(cachedProtesta.provincia_id);
      }

      // Actualizar en segundo plano
      request<Protesta>('get', `/protestas/${protestaId}`)
        .then(freshData => {
          if (JSON.stringify(freshData) !== JSON.stringify(cachedProtesta)) {
            setProtesta(freshData);
            cacheService.set(cacheKey, freshData);
            if (freshData.naturaleza_id) {
              fetchNaturaleza(freshData.naturaleza_id);
            }
            if (freshData.provincia_id) {
              fetchProvincia(freshData.provincia_id);
            }
          }
        })
        .catch(console.error);
    } else {
      try {
        const data = await request<Protesta>('get', `/protestas/${protestaId}`);
        setProtesta(data);
        cacheService.set(cacheKey, data);
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
    }
  }, [request, navigate]);

  const fetchNaturaleza = useCallback(async (naturalezaId: string) => {
    const cacheKey = `naturaleza_${naturalezaId}`;
    const cachedNaturaleza = cacheService.get<Naturaleza>(cacheKey);

    if (cachedNaturaleza) {
      setNaturaleza(cachedNaturaleza);
      // Actualizar en segundo plano
      request<Naturaleza>('get', `/naturalezas/${naturalezaId}`)
        .then(freshData => {
          if (JSON.stringify(freshData) !== JSON.stringify(cachedNaturaleza)) {
            setNaturaleza(freshData);
            cacheService.set(cacheKey, freshData);
          }
        })
        .catch(console.error);
    } else {
      try {
        const data = await request<Naturaleza>('get', `/naturalezas/${naturalezaId}`);
        setNaturaleza(data);
        cacheService.set(cacheKey, data);
      } catch (error) {
        console.error('Error al cargar los detalles de la naturaleza:', error);
      }
    }
  }, [request]);

  const fetchProvincia = useCallback(async (provinciaId: string) => {
    const cacheKey = `provincia_${provinciaId}`;
    const cachedProvincia = cacheService.get<Provincia>(cacheKey);

    if (cachedProvincia) {
      setProvincia(cachedProvincia);
      // Actualizar en segundo plano
      request<Provincia>('get', `/provincias/${provinciaId}`)
        .then(freshData => {
          if (JSON.stringify(freshData) !== JSON.stringify(cachedProvincia)) {
            setProvincia(freshData);
            cacheService.set(cacheKey, freshData);
          }
        })
        .catch(console.error);
    } else {
      try {
        const data = await request<Provincia>('get', `/provincias/${provinciaId}`);
        setProvincia(data);
        cacheService.set(cacheKey, data);
      } catch (error) {
        console.error('Error al cargar los detalles de la provincia:', error);
      }
    }
  }, [request]);

  useEffect(() => {
    if (id && id !== 'crear') {
      fetchProtesta(id);
    }
  }, [id, fetchProtesta]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      if (id && id !== 'crear') {
        cacheService.markAsStale(`protesta_${id}`);
        fetchProtesta(id);
      }
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [id, fetchProtesta]);

  const handleDelete = () => {
    if (id && protesta) {
      Modal.confirm({
        title: `¿Estás seguro de que quieres eliminar la protesta "${protesta.nombre}"?`,
        icon: <ExclamationCircleOutlined />,
        content: 'Esta acción no se puede deshacer.',
        okText: 'Sí',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          try {
            await request('delete', `/protestas/${id}`);
            message.success(`Protesta "${protesta.nombre}" eliminada con éxito`);
            cacheService.remove(`protesta_${id}`);
            cacheService.invalidateRelatedCache('protesta_');
            navigate('/protestas');
          } catch (error) {
            console.error('Error al eliminar la protesta:', error);
            if (error instanceof Error) {
              message.error(`Error al eliminar la protesta: ${error.message}`);
            } else {
              message.error('Error al eliminar la protesta');
            }
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
          {isAdmin() && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          )}
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
        <Descriptions.Item label="Creado por">
          <Space>
            <UserOutlined />
            {protesta.creador_nombre || 'No disponible'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Email del Creador">
          <Space>
            <MailOutlined />
            {protesta.creador_email || 'No disponible'}
          </Space>
        </Descriptions.Item>
      </Descriptions>
      <Descriptions column={1}>
        <Descriptions.Item label="Resumen">{protesta.resumen}</Descriptions.Item>
      </Descriptions>
      <Descriptions title="Cabecillas" column={1}>
        {protesta.cabecillas && protesta.cabecillas.map(c => (
          <Descriptions.Item key={c.id}>
            <Space>
              <Avatar src={getFullImageUrl(c.foto)} alt={`${c.nombre} ${c.apellido}`} />
              {`${c.nombre} ${c.apellido}`}
            </Space>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
};

export default ProtestaDetail;
