import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Typography } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Naturaleza } from '../../types';
import IconSelector from '../../utils/IconSelector';
import * as Icons from '@mui/icons-material';

interface NaturalezaFormData extends Record<string, unknown> {
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
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      const fetchNaturaleza = async () => {
        try {
          const data = await request<Naturaleza>('get', `/naturalezas/${id}`);
          setFormData({
            nombre: data.nombre,
            color: data.color,
            icono: data.icono
          });
        } catch (err) {
          console.error('Error al obtener naturaleza:', err);
        }
      };
      fetchNaturaleza();
    }
  }, [id, request]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await request<Naturaleza>('put', `/naturalezas/${id}`, formData);
      } else {
        await request<Naturaleza>('post', '/naturalezas', formData);
      }
      navigate('/naturalezas');
    } catch (err) {
      console.error('Error al guardar naturaleza:', err);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icono: iconName }));
  };

  const SelectedIcon = formData.icono ? Icons[formData.icono as keyof typeof Icons] : null;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
      </Typography>
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
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
        <Button 
          variant="outlined"
          onClick={() => setIsIconSelectorOpen(true)}
          startIcon={SelectedIcon && <SelectedIcon />}
        >
          {formData.icono ? 'Cambiar Icono' : 'Seleccionar Icono'}
        </Button>
        {SelectedIcon && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            Icono seleccionado: {formData.icono}
          </Typography>
        )}
      </Box>
      <IconSelector
        open={isIconSelectorOpen}
        onClose={() => setIsIconSelectorOpen(false)}
        onSelect={handleIconSelect}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {id ? 'Actualizar' : 'Crear'} Naturaleza
      </Button>
    </Box>
  );
};

export default NaturalezaForm;
