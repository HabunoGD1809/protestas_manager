import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert
} from '@mui/material';
import { User } from '../../types';
// import { useApi } from '../../hooks/useApi';
import ChangeUserRole from './ChangeUserRole';
import Pagination from '../Common/Pagination';
import { userService, getFullImageUrl } from '../../services/api';
import CreateUserForm from './CreateUserForm';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRoleChange = useCallback((userId: string, newRole: 'admin' | 'usuario') => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, rol: newRole } : user
    ));
  }, []);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getAll(page, pageSize);
      // console.log('API Response:', response); //no borrar
      if (Array.isArray(response)) {
        const usersWithFullImageUrls = response.map(user => ({
          ...user,
          foto: getFullImageUrl(user.foto)
        }));
        setUsers(usersWithFullImageUrls);
        setPagination(prev => ({
          ...prev,
          total: response.length,
        }));
      } else if (response && Array.isArray(response.items)) {
        const usersWithFullImageUrls = response.items.map(user => ({
          ...user,
          foto: getFullImageUrl(user.foto)
        }));
        setUsers(usersWithFullImageUrls);
        setPagination({
          current: response.page,
          pageSize: response.page_size,
          total: response.total
        });
      } else {
        throw new Error('Respuesta de API inválida');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar los usuarios. Por favor, intente de nuevo más tarde.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [fetchUsers, pagination.current, pagination.pageSize]);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (userToDelete) {
      try {
        await userService.delete(userToDelete.id);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Error al eliminar el usuario. Por favor, intente de nuevo.');
      }
    }
  }, [userToDelete]);

  const handleCreateUser = useCallback(async (userData: FormData) => {
    try {
      const newUser = await userService.create(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      setCreateDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al crear el usuario. Por favor, intente de nuevo.');
      }
    }
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: theme.spacing(isSmallScreen ? 1 : 2) }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setCreateDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Crear Nuevo Usuario
      </Button>
      {users.length > 0 ? (
        <Grid container spacing={isSmallScreen ? 2 : 3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={isSmallScreen ? 1 : 2}>
                    <Avatar
                      src={user.foto || undefined}
                      alt={`${user.nombre} ${user.apellidos}`}
                      sx={{ width: isSmallScreen ? 60 : 80, height: isSmallScreen ? 60 : 80, mb: 1 }}
                    />
                    <Typography variant={isSmallScreen ? "subtitle1" : "h6"} component="div" textAlign="center">
                      {user.nombre} {user.apellidos}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email: {user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rol: {user.rol}
                  </Typography>
                </CardContent>
                <CardActions sx={{ flexDirection: isSmallScreen ? 'column' : 'row', alignItems: 'stretch' }}>
                  <ChangeUserRole
                    userId={user.id}
                    currentRole={user.rol}
                    onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
                  />
                  <Button 
                    size="small" 
                    color="secondary" 
                    fullWidth={isSmallScreen}
                    onClick={() => {
                      setUserToDelete(user);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" textAlign="center" mt={3}>
          No hay usuarios para mostrar.
        </Typography>
      )}
      <Box mt={4} display="flex" justifyContent="center">
        <Pagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={handlePaginationChange}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar a este usuario?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteUser} color="secondary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <CreateUserForm onSubmit={handleCreateUser} onCancel={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserList;
