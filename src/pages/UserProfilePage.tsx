import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { Box, Avatar, Typography, Container, CircularProgress, Alert } from '@mui/material';

const UserProfilePage: React.FC = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const fetchUserProfile = async () => {
         try {
            const userData = await authService.obtenerUsuarioActual();
            setUser(userData);
            setLoading(false);
         } catch (err) {
            setError('Error al cargar el perfil de usuario');
            setLoading(false);
         }
      };

      fetchUserProfile();
   }, []);

   if (loading) return <Container><CircularProgress /></Container>;
   if (error) return <Container><Alert severity="error">{error}</Alert></Container>;
   if (!user) return <Container><Typography>No se encontró información del usuario</Typography></Container>;

   return (
      <Container
         style={{
            height: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            overflow: 'hidden',
            borderRadius: '8px', 
         }}
      >
         <Box
            maxWidth="sm"
            width="100%"
            bgcolor="white"
            boxShadow={3}
            borderRadius={1}
            padding={2}
            border={2} 
            borderColor="#0C9FFF" 
            style={{
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center'
            }}
         >
            <Box
               display="flex"
               justifyContent="center"
               marginBottom={2}
            >
               <Avatar
                  src={user.foto}
                  alt={`${user.nombre} ${user.apellidos}`}
                  style={{
                     width: 100,
                     height: 100,
                     border: '4px solid #1976d2'
                  }}
               />
            </Box>
            <Typography variant="h5" align="center">{user.nombre} {user.apellidos}</Typography>
            <Typography variant="body1" color="textSecondary"><strong>Nombre:</strong> {user.nombre}</Typography>
            <Typography variant="body1" color="textSecondary"><strong>Apellido:</strong> {user.apellidos}</Typography>
            <Typography variant="body1" color="textSecondary"><strong>Email:</strong> {user.email}</Typography>
            <Typography variant="body1" color="primary"><strong>Rol:</strong> {user.rol}</Typography>
         </Box>
      </Container>
   );
};

export default UserProfilePage;
