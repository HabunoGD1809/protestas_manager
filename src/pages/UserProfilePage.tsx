import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types/types';
import { authService } from '../services/apiService';
import { Box, Avatar, Typography, Container, CircularProgress, Alert, Button, Input } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { message } from 'antd';
import '../styles/UserProfilePage.css';

const UserProfilePage: React.FC = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
   const [photoUrl, setPhotoUrl] = useState<string | null>(null);
   const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      fetchUserProfile();
   }, []);

   const fetchUserProfile = async () => {
      try {
         const userData = await authService.obtenerUsuarioActual();
         setUser(userData);
         setPhotoUrl(userData.foto || null);
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
            // Crear una URL temporal para la vista previa inmediata
            const tempUrl = URL.createObjectURL(file);
            setTempPhotoUrl(tempUrl);

            const updatedUser = await authService.actualizarFotoUsuario(file);
            setUser(updatedUser);
            setPhotoUrl(updatedUser.foto || null);
            message.success('Foto actualizada. Actualiza la página para ver los cambios permanentes.', 5);
         } catch (err) {
            if (err instanceof Error) {
               if ('response' in err && typeof err.response === 'object' && err.response !== null) {
                  const response = err.response as { data?: { detail?: string } };
                  const errorMessage = response.data?.detail || 'Error desconocido al actualizar la foto de perfil';
                  message.error(errorMessage);
               } else {
                  message.error('Error al actualizar la foto de perfil');
               }
            } else {
               message.error('Error inesperado al actualizar la foto de perfil');
            }
            setTempPhotoUrl(null);
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
            <Box display="flex" justifyContent="center" alignItems="center" marginBottom={2} position="relative" flexDirection="column">
               <Avatar
                  src={tempPhotoUrl || photoUrl || undefined}
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
                  style={{ marginTop: '10px' }}
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
