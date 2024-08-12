import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Avatar } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { Cabecilla } from '../../types';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { request } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      const fetchCabecilla = async () => {
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
            setPreviewUrl(data.foto);
          }
        } catch (err) {
          console.error('Error fetching cabecilla:', err);
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
      } else {
        result = await request<Cabecilla>('post', '/cabecillas', formDataToSend);
      }

      if (result && result.foto) {
        setPreviewUrl(result.foto);
      }

      navigate('/cabecillas');
    } catch (err) {
      console.error('Error saving cabecilla:', err);
    }
  };

  const getImageUrl = (url: string | null) => {
    return url ? `${url}?t=${new Date().getTime()}` : undefined;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Avatar src={getImageUrl(previewUrl)} sx={{ width: 100, height: 100 }} />
      </Box>
      <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
        Subir Foto
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
        onChange={handleChange}
        error={!!errors.cedula}
        helperText={errors.cedula || 'Formato: xxx-xxxxxxx-x'}
      />
      <TextField
        margin="normal"
        fullWidth
        id="telefono"
        label="Teléfono"
        name="telefono"
        value={formData.telefono}
        onChange={handleChange}
        error={!!errors.telefono}
        helperText={errors.telefono || 'Formato: xxx-xxx-xxxx'}
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
        {id ? 'Actualizar' : 'Crear'} Cabecilla
      </Button>
    </Box>
  );
};

export default CabecillaForm;
