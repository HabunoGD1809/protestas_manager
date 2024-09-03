import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, Avatar, Snackbar } from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    repetir_password: '',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (formData.password !== formData.repetir_password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      });
      if (foto) {
        formDataToSend.append('foto', foto);
      }
      await register(formDataToSend);
      setOpenSnackbar(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error en el registro:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 400) {
            setError(`Error de validación: ${err.response.data.detail || 'Los datos proporcionados no son válidos.'}`);
          } else if (err.response.status === 409) {
            setError('El usuario ya existe. Por favor, intenta con un correo electrónico diferente.');
          } else {
            setError(`Error del servidor: ${err.response.data.detail || err.message}`);
          }
        } else if (err.request) {
          setError('No se recibió respuesta del servidor. Por favor, intenta de nuevo más tarde.');
        } else {
          setError(`Error de configuración: ${err.message}`);
        }
      } else {
        setError('Ocurrió un error inesperado durante el registro. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Avatar src={previewUrl || undefined} sx={{ width: 100, height: 100 }} />
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
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Registrarse
      </Button>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Registro exitoso. Redirigiendo a la página de inicio de sesión...
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Register;
