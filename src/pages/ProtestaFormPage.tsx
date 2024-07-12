import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProtestaForm from '../components/Protesta/ProtestaForm';
import { Protesta } from '../types';
import { useApi } from '../hooks/useApi';

const ProtestaFormPage: React.FC = () => {
  const [protesta, setProtesta] = useState<Protesta | undefined>(undefined);
  const { id } = useParams<{ id: string }>();
  const { request, loading, error } = useApi();

  useEffect(() => {
    if (id) {
      fetchProtesta(id);
    }
  }, [id]);

  const fetchProtesta = async (protestaId: string) => {
    try {
      const data = await request<Protesta>('get', `/protestas/${protestaId}`);
      setProtesta(data);
    } catch (error) {
      console.error('Error al cargar la protesta', error);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>{id ? 'Editar' : 'Crear'} Protesta</h1>
      <ProtestaForm initialData={protesta} />
    </div>
  );
};

export default ProtestaFormPage;
