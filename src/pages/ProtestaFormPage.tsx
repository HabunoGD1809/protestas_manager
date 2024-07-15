import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Protesta, CrearProtesta } from '../types';
import { useApi } from '../hooks/useApi';
import { message } from 'antd';
import ProtestaForm from '../components/Protesta/ProtestaForm';

const ProtestaFormPage: React.FC = () => {
  const [initialData, setInitialData] = useState<Protesta | undefined>(undefined);
  const { id } = useParams<{ id: string }>();
  const { request, loading, error } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProtesta(id);
    }
  }, [id]);

  const fetchProtesta = async (protestaId: string) => {
    try {
      const data = await request<Protesta>('get', `/protestas/${protestaId}`);
      setInitialData(data);
    } catch (error) {
      console.error('Error al cargar la protesta:', error);
      message.error('Error al cargar los datos de la protesta');
    }
  };

  const handleSubmit = async (values: CrearProtesta) => {
    try {
      if (id) {
        await request<Protesta>('put', `/protestas/${id}`, values);
        message.success('Protesta actualizada con éxito');
      } else {
        await request<Protesta>('post', '/protestas', values);
        message.success('Protesta creada con éxito');
      }
      navigate('/protestas');
    } catch (error) {
      console.error('Error al guardar la protesta:', error);
      if (error instanceof Error) {
        message.error(`Error al guardar la protesta: ${error.message}`);
      } else {
        message.error('Error al guardar la protesta');
      }
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>{id ? 'Editar' : 'Crear'} Protesta</h1>
      <ProtestaForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
};

export default ProtestaFormPage;
