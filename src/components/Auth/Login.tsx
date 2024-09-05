import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const validateEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Por favor, introduce un email válido.',
  CONNECTION_TIMEOUT: 'La conexión al servidor ha excedido el tiempo de espera. Por favor, intenta de nuevo.',
  NO_SERVER_RESPONSE: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta de nuevo.',
  INVALID_CREDENTIALS: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.',
  USER_NOT_FOUND: 'El usuario no existe. Por favor, verifica tu email o regístrate si aún no tienes una cuenta.',
  UNEXPECTED: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.'
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [inactivityMessage, setInactivityMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('inactivity') === 'true') {
      setInactivityMessage('Sesión cerrada por inactividad.');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(ERROR_MESSAGES[result.error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNEXPECTED);
      }
    } catch (error) {
      console.error('Error no manejado en el inicio de sesión:', error);
      setError(ERROR_MESSAGES.UNEXPECTED);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {inactivityMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {inactivityMessage}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Dirección de Email"
        name="email"
        autoComplete="email"
        autoFocus
        value={formData.email}
        onChange={handleChange}
        error={!!error && error.includes('email')}
        helperText={error && error.includes('email') ? error : ''}
        inputProps={{
          'aria-label': 'Dirección de Email',
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Contraseña"
        type="password"
        id="password"
        autoComplete="current-password"
        value={formData.password}
        onChange={handleChange}
        inputProps={{
          'aria-label': 'Contraseña',
        }}
      />
      {error && (
        <Typography color="error" align="center" role="alert">
          {error}
        </Typography>
      )}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Entrar
      </Button>
    </Box>
  );
};

export default Login;
