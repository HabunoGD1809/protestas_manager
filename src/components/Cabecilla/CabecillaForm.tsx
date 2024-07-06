import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box } from '@mui/material';
import { useApi } from '../../hooks/useApi';

interface CabecillaFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  direccion: string;
}

const CabecillaForm: React.FC = () => {
  const [formData, setFormData] = useState<CabecillaFormData>({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
  });
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      const fetchCabecilla = async () => {
        try {
          const data = await request('get', `/cabecillas/${id}`);
          setFormData(data);
        } catch (err) {
          console.error('Error fetching cabecilla:', err);
        }
      };
      fetchCabecilla();
    }
  }, [id, request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await request('put', `/cabecillas/${id}`, formData);
      } else {
        await request('post', '/cabecillas', formData);
      }
      navigate('/cabecillas');
    } catch (err) {
      console.error('Error saving cabecilla:', err);
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
        id="apellido"
        label="Apellido"
        name="apellido"
        value={formData.apellido}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="cedula"
        label="Cédula"
        name="cedula"
        value={formData.cedula}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        fullWidth
        id="telefono"
        label="Teléfono"
        name="telefono"
        value={formData.telefono}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        fullWidth
        id="direccion"
        label="Dirección"
        name="direccion"
        value={formData.direccion}
        onChange={handleChange}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {id ? 'Update' : 'Create'} Cabecilla
      </Button>
    </Box>
  );
};

export default CabecillaForm;
