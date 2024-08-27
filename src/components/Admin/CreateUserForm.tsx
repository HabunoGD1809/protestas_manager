import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Avatar, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { getFullImageUrl } from '../../services/apiService';

interface CreateUserFormProps {
  onSubmit: (userData: FormData) => void;
  onCancel: () => void;
  initialData?: {
    nombre: string;
    apellidos: string;
    email: string;
    rol: 'usuario' | 'admin';
    foto?: string;
  };
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    apellidos: initialData?.apellidos || '',
    email: initialData?.email || '',
    password: '',
    repetir_password: '',
    rol: initialData?.rol || 'usuario',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.foto ? getFullImageUrl(initialData.foto) || null : null
  );
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: SelectChangeEvent<'usuario' | 'admin'>) => {
    setFormData(prev => ({ ...prev, rol: e.target.value as 'usuario' | 'admin' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFoto(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.repetir_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password || !formData.repetir_password) {
      setError('Por favor, complete todos los campos.');
      return;
    }
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key as keyof typeof formData]);
    });
    if (foto) {
      formDataToSend.append('foto', foto);
    }
    try {
      await onSubmit(formDataToSend);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al crear el usuario. Por favor, intente de nuevo.');
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Avatar src={previewUrl || undefined} sx={{ width: 100, height: 100 }} />
      </Box>
      <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
        {initialData ? 'Cambiar Foto' : 'Subir Foto'}
        <input type="file" hidden onChange={handleFileChange} accept="image/*" />
      </Button>
      <TextField
        margin="normal"
        required
        fullWidth
        id="nombre"
        label="Nombre"
        name="nombre"
        autoFocus
        value={formData.nombre}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="apellidos"
        label="Apellidos"
        name="apellidos"
        value={formData.apellidos}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Correo Electrónico"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Contraseña"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="repetir_password"
        label="Repetir Contraseña"
        type="password"
        id="repetir_password"
        autoComplete="new-password"
        value={formData.repetir_password}
        onChange={handleChange}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="rol-label">Rol</InputLabel>
        <Select
          labelId="rol-label"
          id="rol"
          name="rol"
          value={formData.rol}
          label="Rol"
          onChange={handleRoleChange}
        >
          <MenuItem value="usuario">Usuario</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
      </FormControl>
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="contained" color="primary">
          {initialData ? 'Actualizar' : 'Crear'} Usuario
        </Button>
      </Box>
    </Box>
  );
};

export default CreateUserForm;
