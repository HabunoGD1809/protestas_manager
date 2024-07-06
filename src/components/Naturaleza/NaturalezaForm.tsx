import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box } from '@mui/material';
import { useApi } from '../../hooks/useApi';

interface NaturalezaFormData {
  nombre: string;
  color: string;
  icono: string;
}

const NaturalezaForm: React.FC = () => {
  const [formData, setFormData] = useState<NaturalezaFormData>({
    nombre: '',
    color: '',
    icono: '',
  });
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      const fetchNaturaleza = async () => {
        try {
          const data = await request('get', `/naturalezas/${id}`);
          setFormData(data);
        } catch (err) {
          console.error('Error fetching naturaleza:', err);
        }
      };
      fetchNaturaleza();
    }
  }, [id, request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await request('put', `/naturalezas/${id}`, formData);
      } else {
        await request('post', '/naturalezas', formData);
      }
      navigate('/naturalezas');
    } catch (err) {
      console.error('Error saving naturaleza:', err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="nombre"
        label="Nombre"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="color"
        label="Color"
        name="color"
        type="color"
        value={formData.color}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        fullWidth
        id="icono"
        label="Icono"
        name="icono"
        value={formData.icono}
        onChange={handleChange}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {id ? 'Update' : 'Create'} Naturaleza
      </Button>
    </Box>
  );
};

export default NaturalezaForm;
