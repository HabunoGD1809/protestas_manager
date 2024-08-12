import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [inactivityMessage, setInactivityMessage] = useState('');
  const { login, checkUserExists } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inactivity = params.get('inactivity');
    if (inactivity === 'true') {
      setInactivityMessage('Sesión cerrada por inactividad.');
    }
  }, [location]);

  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Por favor, introduce un email válido.');
      return;
    }

    try {
      console.log('Verificando existencia del usuario...');
      const userExists = await checkUserExists(email);
      console.log('Resultado de verificación:', userExists);

      if (!userExists) {
        setError('El usuario no está registrado en la base de datos.');
        return;
      }

      console.log('Usuario verificado, intentando iniciar sesión...');
      await login(email, password);
      console.log('Inicio de sesión exitoso');
      navigate('/');
    } catch (err) {
      console.error('Error durante el proceso de inicio de sesión:', err);
      if (err instanceof Error) {
        setError(`Error de autenticación: ${err.message}`);
      } else {
        setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
      }
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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
