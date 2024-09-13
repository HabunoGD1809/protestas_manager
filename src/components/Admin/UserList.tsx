import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Chip,
  Box,
  TextField,
  DialogActions,
  Button,
  CardContent,
  Card,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment
} from '@mui/material';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { User } from '../../types/types';
import Pagination from '../Common/Pagination';
import { userService, getFullImageUrl } from '../../services/apiService';
import CreateUserForm from './CreateUserForm';
import { cacheService } from '../../services/cacheService';
import {
  StyledBox,
  StyledErrorAlert,
  StyledCreateButton,
  StyledPaginationContainer,
  StyledNoUsersText,
  StyledLoadingContainer,
  StyledCurrentUserChip
} from '../../styles/UserListStyles';

const { confirm } = Modal;

const handleError = (error: unknown, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  console.error('Error:', errorMessage);
  setError(errorMessage);
  message.error(errorMessage);
};

const UserList: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      handleError(err, setError);
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    setIsLoading(true);
    setError(null);
    const cacheKey = `users_${page}_${pageSize}`;

    try {
      const cachedData = cacheService.get<{ users: User[], pagination: typeof pagination }>(cacheKey);

      if (cachedData) {
        setUsers(cachedData.users);
        setPagination(cachedData.pagination);
        setIsLoading(false);

        userService.getAll(page, pageSize).then(response => {
          let usersData: User[] = [];
          let paginationData = { current: page, pageSize: pageSize, total: 0 };

          if (Array.isArray(response)) {
            usersData = response;
            paginationData.total = response.length;
          } else if (response && 'items' in response && Array.isArray(response.items)) {
            usersData = response.items;
            paginationData = {
              current: response.page,
              pageSize: response.page_size,
              total: response.total
            };
          }

          const usersWithFullImageUrls = usersData.map(user => ({
            ...user,
            foto: getFullImageUrl(user.foto)
          }));

          setUsers(usersWithFullImageUrls);
          setPagination(paginationData);
          cacheService.set(cacheKey, { users: usersWithFullImageUrls, pagination: paginationData });
        }).catch(err => {
          console.error('Error actualizando datos en segundo plano:', err);
        });
      } else {
        const response = await userService.getAll(page, pageSize);
        let usersData: User[] = [];
        let paginationData = { current: page, pageSize: pageSize, total: 0 };

        if (Array.isArray(response)) {
          usersData = response;
          paginationData.total = response.length;
        } else if (response && 'items' in response && Array.isArray(response.items)) {
          usersData = response.items;
          paginationData = {
            current: response.page,
            pageSize: response.page_size,
            total: response.total
          };
        } else {
          throw new Error('Formato de respuesta inesperado');
        }

        const usersWithFullImageUrls = usersData.map(user => ({
          ...user,
          foto: getFullImageUrl(user.foto)
        }));

        setUsers(usersWithFullImageUrls);
        setPagination(paginationData);
        cacheService.set(cacheKey, { users: usersWithFullImageUrls, pagination: paginationData });
      }
    } catch (err) {
      handleError(err, setError);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRoleChange = useCallback(async (userId: string, newRole: 'admin' | 'usuario') => {
    try {
      await userService.updateRole(userId, newRole);
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === userId ? { ...user, rol: newRole } : user
      ));
      message.success(`Rol de usuario actualizado a ${newRole}`);
      cacheService.invalidateRelatedCache('users_');
    } catch (error) {
      handleError(error, setError);
    }
  }, []);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    confirm({
      title: '¿Estás seguro de que quieres eliminar este usuario?',
      icon: <ExclamationCircleOutlined />,
      content: `Se eliminará el usuario "${user.nombre} ${user.apellidos}"`,
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          if (currentUser && currentUser.id === user.id) {
            throw new Error('No puedes eliminar tu propia cuenta.');
          }

          await userService.delete(user.id);
          setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
          message.success('Usuario eliminado exitosamente');
          cacheService.invalidateRelatedCache('users_');
        } catch (error) {
          handleError(error, setError);
        }
      },
    });
  }, [currentUser]);

  const handleCreateUser = useCallback(async (userData: FormData) => {
    try {
      const newUser = await userService.create(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      setCreateDialogOpen(false);
      message.success('Usuario creado exitosamente');
      cacheService.invalidateRelatedCache('users_');
    } catch (error) {
      handleError(error, setError);
    }
  }, []);

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

  const handleResetPassword = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setConfirmPasswordError('');
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (selectedUserId && newPassword) {
      const validationError = validatePassword(newPassword);
      if (validationError) {
        setPasswordError(validationError);
        return;
      }
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Las contraseñas no coinciden');
        return;
      }
      try {
        await userService.resetPassword(selectedUserId, newPassword);
        message.success('Contraseña restablecida exitosamente');
        setResetPasswordDialogOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setConfirmPasswordError('');
      } catch (error) {
        if (error instanceof Error) {
          setPasswordError(error.message);
        } else {
          handleError(error, setError);
        }
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [fetchUsers, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      fetchUsers(pagination.current, pagination.pageSize);
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [fetchUsers, pagination, pagination.pageSize]);

  if (isLoading) {
    return (
      <StyledLoadingContainer>
        <CircularProgress />
      </StyledLoadingContainer>
    );
  }

  return (
    <StyledBox>
      {error && (
        <StyledErrorAlert>
          <Alert severity="error">
            {error}
          </Alert>
        </StyledErrorAlert>
      )}
      <StyledCreateButton
        variant="contained"
        color="primary"
        onClick={() => setCreateDialogOpen(true)}
      >
        Crear Nuevo Usuario
      </StyledCreateButton>
      {users.length > 0 ? (
        <Grid container spacing={isSmallScreen ? 2 : 3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card elevation={3} sx={{ position: 'relative', height: '100%' }}>
                <IconButton
                  aria-label="settings"
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={(event) => handleMenuOpen(event, user)}
                >
                  <MoreVertIcon />
                </IconButton>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
                  <Avatar
                    src={user.foto || undefined}
                    alt={`${user.nombre} ${user.apellidos}`}
                    sx={{ width: 80, height: 80, mb: 2 }}
                  />
                  <Typography variant={isSmallScreen ? "subtitle1" : "h6"} align="center">
                    {user.nombre} {user.apellidos}
                    {currentUser?.id === user.id && (
                      <StyledCurrentUserChip label="Tú" color="primary" size="small" />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {user.email}
                  </Typography>
                  <Box mt={1}>
                    <Chip label={user.rol} color={user.rol === 'admin' ? 'secondary' : 'default'} size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <StyledNoUsersText variant="body1">
          No hay usuarios para mostrar.
        </StyledNoUsersText>
      )}
      <StyledPaginationContainer>
        <Pagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={handlePaginationChange}
        />
      </StyledPaginationContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleRoleChange(menuUser!.id, menuUser!.rol === 'admin' ? 'usuario' : 'admin');
            handleMenuClose();
          }}
          disabled={currentUser?.id === menuUser?.id}
        >
          <ListItemIcon>
            <AdminPanelSettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Cambiar a {menuUser?.rol === 'admin' ? 'Usuario' : 'Admin'}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleResetPassword(menuUser!.id);
            handleMenuClose();
          }}
          disabled={currentUser?.id === menuUser?.id}
        >
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Restablecer Contraseña</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteUser(menuUser!);
            handleMenuClose();
          }}
          disabled={currentUser?.id === menuUser?.id}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar Usuario</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <CreateUserForm onSubmit={handleCreateUser} onCancel={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Restablecer Contraseña
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nueva Contraseña"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(validatePassword(e.target.value));
            }}
            variant="outlined"
            error={!!passwordError}
            helperText={passwordError}
            sx={{ mb: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Confirmar Nueva Contraseña"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmPasswordError(e.target.value !== newPassword ? 'Las contraseñas no coinciden' : '');
            }}
            variant="outlined"
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 1 }}>
          <Button onClick={() => setResetPasswordDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmResetPassword}
            color="primary"
            variant="contained"
            disabled={!newPassword || !!passwordError || !confirmPassword || !!confirmPasswordError}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </StyledBox>
  );
};

export default UserList;
