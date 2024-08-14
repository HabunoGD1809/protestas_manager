import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Typography, Popover } from '@mui/material';
import { ChromePicker, ColorResult } from 'react-color';
import { message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { Naturaleza, CrearNaturaleza } from '../../types';
import IconSelector from '../../utils/IconSelector';
import * as Icons from '@mui/icons-material';

const NaturalezaForm: React.FC = () => {
  const [formData, setFormData] = useState<CrearNaturaleza>({
    nombre: '',
    color: '#111111',
    icono: '',
  });
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
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
          message.error('Error al cargar los datos de la naturaleza');
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
    
    if (!formData.nombre || !formData.color) {
      message.error('El nombre y el color son obligatorios');
      return;
    }
    
    try {
      if (id) {
        await request<Naturaleza>('put', `/naturalezas/${id}`, formData);
        message.success('Naturaleza actualizada exitosamente');
      } else {
        await request<Naturaleza>('post', '/naturalezas', formData);
        message.success('Naturaleza creada exitosamente');
      }
      navigate('/naturalezas');
    } catch (err) {
      console.error('Error al guardar naturaleza:', err);
      message.error('Error al guardar la naturaleza');
    }
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icono: iconName }));
  };

  const handleColorChange = (color: ColorResult) => {
    setFormData(prev => ({ ...prev, color: color.hex }));
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
      <Box sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={(e) => {
              setColorAnchorEl(e.currentTarget);
              setIsColorPickerOpen(true);
            }}
            sx={{ mr: 2 }}
          >
            Seleccionar Color
          </Button>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: formData.color,
              border: '1px solid #000',
              borderRadius: 1
            }}
          />
        </Box>
        <Popover
          open={isColorPickerOpen}
          anchorEl={colorAnchorEl}
          onClose={() => setIsColorPickerOpen(false)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <ChromePicker
            color={formData.color}
            onChange={handleColorChange}
            disableAlpha
          />
        </Popover>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setIsIconSelectorOpen(true)}
          startIcon={SelectedIcon && <SelectedIcon />}
          sx={{
            borderColor: formData.color,
            color: formData.color,
            '&:hover': {
              borderColor: formData.color,
              backgroundColor: `${formData.color}10`,
            }
          }}
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
