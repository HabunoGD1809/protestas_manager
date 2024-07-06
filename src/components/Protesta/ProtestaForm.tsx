import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Naturaleza, Provincia, Cabecilla } from '../../types';

interface ProtestaFormData {
  nombre: string;
  resumen: string;
  fecha_evento: string;
  naturaleza_id: string;
  provincia_id: string;
  cabecillas: string[];
}

const ProtestaForm: React.FC = () => {
  const [formData, setFormData] = useState<ProtestaFormData>({
    nombre: '',
    resumen: '',
    fecha_evento: '',
    naturaleza_id: '',
    provincia_id: '',
    cabecillas: [],
  });
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchData = async () => {
      const [naturalezasData, provinciasData, cabecillasData] = await Promise.all([
        request('get', '/naturalezas'),
        request('get', '/provincias'),
        request('get', '/cabecillas'),
      ]);
      setNaturalezas(naturalezasData);
      setProvincias(provinciasData);
      setCabecillas(cabecillasData);

      if (id) {
        const protestaData = await request('get', `/protestas/${id}`);
        setFormData({
          nombre: protestaData.nombre,
          resumen: protestaData.resumen,
          fecha_evento: protestaData.fecha_evento,
          naturaleza_id: protestaData.naturaleza_id,
          provincia_id: protestaData.provincia_id,
          cabecillas: protestaData.cabecillas.map((c: Cabecilla) => c.id),
        });
      }
    };
    fetchData();
  }, [id, request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await request('put', `/protestas/${id}`, formData);
      } else {
        await request('post', '/protestas', formData);
      }
      navigate('/protestas');
    } catch (err) {
      console.error('Error saving protesta:', err);
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
        id="resumen"
        label="Resumen"
        name="resumen"
        multiline
        rows={4}
        value={formData.resumen}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="fecha_evento"
        label="Fecha del evento"
        name="fecha_evento"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={formData.fecha_evento}
        onChange={handleChange}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="naturaleza-label">Naturaleza</InputLabel>
        <Select
          labelId="naturaleza-label"
          id="naturaleza_id"
          name="naturaleza_id"
          value={formData.naturaleza_id}
          onChange={handleChange}
        >
          {naturalezas.map((naturaleza) => (
            <MenuItem key={naturaleza.id} value={naturaleza.id}>
              {naturaleza.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel id="provincia-label">Provincia</InputLabel>
        <Select
          labelId="provincia-label"
          id="provincia_id"
          name="provincia_id"
          value={formData.provincia_id}
          onChange={handleChange}
        >
          {provincias.map((provincia) => (
            <MenuItem key={provincia.id} value={provincia.id}>
              {provincia.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel id="cabecillas-label">Cabecillas</InputLabel>
        <Select
          labelId="cabecillas-label"
          id="cabecillas"
          name="cabecillas"
          multiple
          value={formData.cabecillas}
          onChange={handleChange}
        >
          {cabecillas.map((cabecilla) => (
            <MenuItem key={cabecilla.id} value={cabecilla.id}>
              {cabecilla.nombre} {cabecilla.apellido}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {id ? 'Update' : 'Create'} Protesta
      </Button>
    </Box>
  );
};

export default ProtestaForm;
