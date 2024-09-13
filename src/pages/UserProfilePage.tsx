import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types/types';
import { authService, userService } from '../services/apiService';
import { Box, Avatar, Typography, Container, CircularProgress, Alert, Button, Input, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { message } from 'antd';
import '../styles/UserProfilePage.css';
import { cacheService } from '../services/cacheService';
import axios, { AxiosError } from 'axios';

const UserProfilePage: React.FC = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [uploading, setUploading] = useState(false);
   const [photoUrl, setPhotoUrl] = useState<string | null>(null);
   const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Estados para el cambio de contraseña
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
   const [currentPasswordError, setCurrentPasswordError] = useState('');
   const [newPasswordError, setNewPasswordError] = useState('');
   const [confirmPasswordError, setConfirmPasswordError] = useState('');

   const fetchUserProfile = useCallback(async () => {
      setLoading(true);
      try {
         const userData = await authService.obtenerUsuarioActual();
         setUser(userData);
         setPhotoUrl(userData.foto || null);
         cacheService.set('currentUser', userData);
      } catch (err) {
         setError('Error al cargar el perfil de usuario');
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchUserProfile();
   }, [fetchUserProfile]);

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         setUploading(true);
         try {
            const tempUrl = URL.createObjectURL(file);
            setTempPhotoUrl(tempUrl);

            const updatedUser = await authService.actualizarFotoUsuario(file);
            setUser(updatedUser);
            setPhotoUrl(updatedUser.foto || null);

            cacheService.set('currentUser', updatedUser);

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

   const validatePassword = (password: string): string => {
      if (password.length < 8) {
         return 'La contraseña debe tener al menos 8 caracteres';
      }
      if (!/[A-Z]/.test(password)) {
         return 'La contraseña debe contener al menos una letra mayúscula';
      }
      if (!/[a-z]/.test(password)) {
         return 'La contraseña debe contener al menos una letra minúscula';
      }
      if (!/[0-9]/.test(password)) {
         return 'La contraseña debe contener al menos un número';
      }
      return '';
   };

   const validatePasswords = () => {
      let isValid = true;

      if (!currentPassword) {
         setCurrentPasswordError('La contraseña actual es requerida');
         isValid = false;
      } else {
         setCurrentPasswordError('');
      }

      const newPasswordValidation = validatePassword(newPassword);
      if (newPasswordValidation) {
         setNewPasswordError(newPasswordValidation);
         isValid = false;
      } else if (newPassword === currentPassword) {
         setNewPasswordError('La nueva contraseña debe ser diferente de la actual');
         isValid = false;
      } else {
         setNewPasswordError('');
      }

      if (newPassword !== confirmPassword) {
         setConfirmPasswordError('Las contraseñas no coinciden');
         isValid = false;
      } else {
         setConfirmPasswordError('');
      }

      return isValid;
   };

   const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validatePasswords()) {
         return;
      }
      if (user) {
         try {
            await userService.changePassword(
               user.id,
               currentPassword,
               newPassword
            );
            message.success('Contraseña cambiada exitosamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordDialogOpen(false);
         } catch (error) {
            if (axios.isAxiosError(error)) {
               const axiosError = error as AxiosError<{ detail: string }>;
               if (axiosError.response) {
                  if (axiosError.response.status === 400) {
                     const errorDetail = axiosError.response.data.detail;
                     if (errorDetail === "La contraseña actual es incorrecta") {
                        setCurrentPasswordError(errorDetail);
                     } else if (errorDetail === "La nueva contraseña debe ser diferente de la actual") {
                        setNewPasswordError(errorDetail);
                     } else if (errorDetail.includes("La nueva contraseña")) {
                        setNewPasswordError(errorDetail);
                     } else {
                        message.error(errorDetail || 'Error al cambiar la contraseña');
                     }
                  } else if (axiosError.response.status === 500) {
                     message.error('Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
                  }
               } else {
                  message.error('Error de red al cambiar la contraseña');
               }
            } else {
               message.error('Error desconocido al cambiar la contraseña');
            }
         }
      }
   };

   const isChangePasswordButtonDisabled = !currentPassword || !newPassword || !confirmPassword ||
      !!currentPasswordError || !!newPasswordError || !!confirmPasswordError;

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

            <Button
               variant="contained"
               color="primary"
               onClick={() => setPasswordDialogOpen(true)}
               style={{ marginTop: '20px' }}
            >
               Cambiar Contraseña
            </Button>

            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
               <DialogTitle>Cambiar Contraseña</DialogTitle>
               <DialogContent>
                  <form onSubmit={handleChangePassword}>
                     <TextField
                        type="password"
                        label="Contraseña Actual"
                        value={currentPassword}
                        onChange={(e) => {
                           setCurrentPassword(e.target.value);
                           setCurrentPasswordError('');
                        }}
                        fullWidth
                        margin="normal"
                        error={!!currentPasswordError}
                        helperText={currentPasswordError}
                     />
                     <TextField
                        type="password"
                        label="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => {
                           setNewPassword(e.target.value);
                           setNewPasswordError(validatePassword(e.target.value));
                        }}
                        fullWidth
                        margin="normal"
                        error={!!newPasswordError}
                        helperText={newPasswordError}
                     />
                     <TextField
                        type="password"
                        label="Confirmar Nueva Contraseña"
                        value={confirmPassword}
                        onChange={(e) => {
                           setConfirmPassword(e.target.value);
                           setConfirmPasswordError(e.target.value !== newPassword ? 'Las contraseñas no coinciden' : '');
                        }}
                        fullWidth
                        margin="normal"
                        error={!!confirmPasswordError}
                        helperText={confirmPasswordError}
                     />
                     <DialogActions>
                        <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
                        <Button
                           type="submit"
                           color="primary"
                           disabled={isChangePasswordButtonDisabled}
                        >
                           Cambiar Contraseña
                        </Button>
                     </DialogActions>
                  </form>
               </DialogContent>
            </Dialog>
         </Box>
      </Container>
   );
};

export default UserProfilePage;
