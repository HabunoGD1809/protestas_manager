import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Avatar, CircularProgress } from '@mui/material';
import { message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';
import { getFullImageUrl } from '../../services/api';

interface CabecillaFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  direccion: string;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
}

const CabecillaForm: React.FC = () => {
  const [formData, setFormData] = useState<CabecillaFormData>({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null | undefined>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const cedulaRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const fetchCabecilla = async () => {
        setIsLoading(true);
        try {
          const data = await request<Cabecilla>('get', `/cabecillas/${id}`);
          setFormData({
            nombre: data.nombre,
            apellido: data.apellido,
            cedula: data.cedula,
            telefono: data.telefono || '',
            direccion: data.direccion || '',
          });
          if (data.foto) {
            const fullImageUrl = getFullImageUrl(data.foto);
            setPreviewUrl(fullImageUrl || null);
          }
        } catch (err) {
          console.error('Error fetching cabecilla:', err);
          message.error('Error al cargar los datos del cabecilla');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCabecilla();
    }
  }, [id, request]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
      isValid = false;
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
      isValid = false;
    }

    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    if (!cedulaRegex.test(formData.cedula)) {
      newErrors.cedula = 'La cédula debe tener el formato xxx-xxxxxxx-x';
      isValid = false;
    }

    const telefonoRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (formData.telefono && !telefonoRegex.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener el formato xxx-xxx-xxxx';
      isValid = false;
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      if (foto) {
        formDataToSend.append('foto', foto);
      }

      let result;
      if (id) {
        result = await request<Cabecilla>('put', `/cabecillas/${id}`, formDataToSend);
        message.success('Cabecilla actualizado exitosamente');
      } else {
        result = await request<Cabecilla>('post', '/cabecillas', formDataToSend);
        message.success('Cabecilla creado exitosamente');
      }

      if (result && result.foto) {
        const fullImageUrl = getFullImageUrl(result.foto);
        setPreviewUrl(fullImageUrl || null);
      }

      navigate('/cabecillas');
    } catch (err) {
      console.error('Error saving cabecilla:', err);
      message.error('Error al guardar el cabecilla');
    } finally {
      setIsLoading(false);
    }
  };

  const applyMask = (value: string, pattern: string): string => {
  let i = 0;
  return pattern.replace(/9/g, () => value[i++] || '');
};

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const maskedValue = applyMask(value, '999-9999999-9');
    setFormData({ ...formData, cedula: maskedValue });
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const maskedValue = applyMask(value, '999-999-9999');
    setFormData({ ...formData, telefono: maskedValue });
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && (
        <Box sx={{ color: 'error.main', mb: 2 }}>
          {error}
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Avatar src={previewUrl || undefined} sx={{ width: 100, height: 100 }} />
      </Box>
      <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
        {previewUrl ? 'Cambiar Foto' : 'Subir Foto'}
        <input type="file" hidden onChange={handleFileChange} accept="image/*" />
      </Button>
      <TextField
        margin="normal"
        required
        fullWidth
        id="nombre"
        label="Nombre"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        error={!!errors.nombre}
        helperText={errors.nombre}
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
        error={!!errors.apellido}
        helperText={errors.apellido}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="cedula"
        label="Cédula"
        name="cedula"
        value={formData.cedula}
        onChange={handleCedulaChange}
        inputRef={cedulaRef}
        error={!!errors.cedula}
        helperText={errors.cedula || 'Formato: xxx-xxxxxxx-x'}
        inputProps={{ maxLength: 13 }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="telefono"
        label="Teléfono"
        name="telefono"
        value={formData.telefono}
        onChange={handleTelefonoChange}
        inputRef={telefonoRef}
        error={!!errors.telefono}
        helperText={errors.telefono || 'Formato: xxx-xxx-xxxx'}
        inputProps={{ maxLength: 12 }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="direccion"
        label="Dirección"
        name="direccion"
        value={formData.direccion}
        onChange={handleChange}
        error={!!errors.direccion}
        helperText={errors.direccion}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
        {id ? 'Actualizar' : 'Crear'} Cabecilla
      </Button>
    </Box>
  );
};

export default CabecillaForm;
