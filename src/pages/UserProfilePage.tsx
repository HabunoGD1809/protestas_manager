import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { Box, Avatar, Typography, Container, CircularProgress, Alert, Button, Input } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import '../styles/UserProfilePage.css';

const UserProfilePage: React.FC = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      fetchUserProfile();
   }, []);

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

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         setUploading(true);
         try {
            const updatedUser = await authService.actualizarFotoUsuario(file);
            setUser(updatedUser);
         } catch (err) {
            setError('Error al actualizar la foto de perfil');
         } finally {
            setUploading(false);
         }
      }
   };

   const triggerFileInput = () => {
      fileInputRef.current?.click();
   };

   if (loading) return <Container><CircularProgress /></Container>;
   if (error) return <Container><Alert severity="error">{error}</Alert></Container>;
   if (!user) return <Container><Typography>No se encontró información del usuario</Typography></Container>;

   return (
      <Container className="user-profile-container">
         <Box className="user-profile-box">
            <Box display="flex" justifyContent="center" alignItems="center" marginBottom={2} position="relative">
               <Avatar
                  src={user.foto}
                  alt={`${user.nombre} ${user.apellidos}`}
                  className="user-avatar"
               />
               <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<CameraAltIcon />}
                  onClick={triggerFileInput}
                  className="change-photo-button"
                  disabled={uploading}
                  style={{ marginLeft: '10px' }} // Ajustar margen para alineación
               >
                  {uploading ? 'Subiendo...' : 'Cambiar foto'}
               </Button>
               <Input
                  type="file"
                  inputRef={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  inputProps={{ accept: 'image/*' }}
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
