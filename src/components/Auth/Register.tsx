import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    repetir_password: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.repetir_password) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="nombre"
        label="First Name"
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
        label="Last Name"
        name="apellidos"
        value={formData.apellidos}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
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
        label="Password"
        type="password"
        id="password"
        value={formData.password}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="repetir_password"
        label="Repeat Password"
        type="password"
        id="repetir_password"
        value={formData.repetir_password}
        onChange={handleChange}
      />
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        Register
      </Button>
    </Box>
  );
};

export default Register;
