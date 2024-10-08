import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Avatar, CircularProgress } from '@mui/material';
import { message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { CrearCabecilla, Cabecilla } from '../../types/types';
import { getFullImageUrl } from '../../services/apiService';
import { AxiosError } from 'axios';
import { SxProps, Theme } from '@mui/material/styles';

interface ApiErrorData {
  detail?: string;
}

type ApiError = AxiosError<ApiErrorData>;

type FormErrors = {
  [K in keyof CrearCabecilla]?: string;
};

const CabecillaForm: React.FC = () => {
  const [formData, setFormData] = useState<CrearCabecilla>({
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
            setPreviewUrl(getFullImageUrl(data.foto) || null);
          }
        } catch (err) {
          console.error('Error al cargar los datos del cabecilla:', err);
          message.error('Error al cargar los datos del cabecilla');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCabecilla();
    }
  }, [id, request]);

  const validateCedula = useCallback((value: string): boolean => {
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    return cedulaRegex.test(value);
  }, []);

  const validateTelefono = useCallback((value: string): boolean => {
    const telefonoRegex = /^\d{3}-\d{3}-\d{4}$/;
    return telefonoRegex.test(value);
  }, []);

  const validateForm = useCallback((): boolean => {
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
    if (!validateCedula(formData.cedula)) {
      newErrors.cedula = 'La cédula debe tener el formato xxx-xxxxxxx-x';
      isValid = false;
    }
    if (formData.telefono && !validateTelefono(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener el formato xxx-xxx-xxxx';
      isValid = false;
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateCedula, validateTelefono]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
  }, []);

  const applyMask = useCallback((value: string, pattern: string): string => {
    let i = 0;
    return pattern.replace(/9/g, () => value[i++] || '');
  }, []);

  const handleCedulaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = applyMask(value, '999-9999999-9');
    setFormData(prevData => ({ ...prevData, cedula: formattedValue }));
    setErrors(prevErrors => ({ ...prevErrors, cedula: undefined }));
  }, [applyMask]);

  const handleTelefonoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = applyMask(value, '999-999-9999');
    setFormData(prevData => ({ ...prevData, telefono: formattedValue }));
    setErrors(prevErrors => ({ ...prevErrors, telefono: undefined }));
  }, [applyMask]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (foto) {
        formDataToSend.append('foto', foto);
      }

      const result = id
        ? await request<Cabecilla>('put', `/cabecillas/${id}`, formDataToSend)
        : await request<Cabecilla>('post', '/cabecillas', formDataToSend);

      if (result && result.foto) {
        setPreviewUrl(getFullImageUrl(result.foto) || null);
      }

      message.success(id ? 'Cabecilla actualizado exitosamente' : 'Cabecilla creado exitosamente');
      navigate('/cabecillas');
    } catch (err: unknown) {
      console.error('Error al guardar el cabecilla:', err);
      if (err instanceof AxiosError) {
        const apiError: ApiError = err;
        if (apiError.response && apiError.response.status === 400) {
          const detail = apiError.response.data?.detail;
          if (detail?.includes('Ya existe un cabecilla con la cédula')) {
            setErrors(prevErrors => ({ ...prevErrors, cedula: 'Esta cédula ya está registrada en la base de datos' }));
            message.error('Esta cédula ya está registrada en la base de datos');
          } else {
            message.error(detail || 'Error al guardar el cabecilla. Por favor, verifique los datos e intente nuevamente.');
          }
        } else {
          message.error('Error al guardar el cabecilla. Por favor, intente nuevamente más tarde.');
        }
      } else {
        message.error('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, foto, id, navigate, request, validateForm]);

  const getFieldStyle = useCallback((field: 'cedula' | 'telefono'): SxProps<Theme> => {
    const value = formData[field];
    if (!value) return {};

    const isValid = field === 'cedula' ? validateCedula(value) : validateTelefono(value);
    const borderColor = isValid ? 'green' : 'red';

    return {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: borderColor,
          borderWidth: '2px',
        },
        '&:hover fieldset': {
          borderColor: borderColor,
          borderWidth: '2px',
        },
        '&.Mui-focused fieldset': {
          borderColor: borderColor,
          borderWidth: '2px',
        },
      },
    };
  }, [formData, validateCedula, validateTelefono]);

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
        error={!!errors.cedula}
        helperText={errors.cedula || 'Formato: xxx-xxxxxxx-x'}
        inputProps={{ maxLength: 13 }}
        sx={getFieldStyle('cedula')}
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
        error={!!errors.telefono}
        helperText={errors.telefono || 'Formato: xxx-xxx-xxxx'}
        inputProps={{ maxLength: 12 }}
        sx={getFieldStyle('telefono')}
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
