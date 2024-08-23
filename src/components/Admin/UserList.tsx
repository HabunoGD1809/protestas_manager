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
  Box
} from '@mui/material';
import { User } from '../../types';
import ChangeUserRole from './ChangeUserRole';
import Pagination from '../Common/Pagination';
import { userService, getFullImageUrl } from '../../services/api';
import CreateUserForm from './CreateUserForm';
import { message } from 'antd';
import DeleteConfirmationDialog from '../Common/DeleteConfirmationDialog';
import {
  StyledBox,
  StyledErrorAlert,
  StyledCreateButton,
  StyledCard,
  StyledCardContent,
  StyledAvatar,
  StyledUserName,
  StyledUserInfo,
  StyledCardActions,
  StyledPaginationContainer,
  StyledNoUsersText,
  StyledLoadingContainer,
  StyledCurrentUserChip
} from '../../styles/UserListStyles';

// Función de utilidad para manejar errores de manera consistente
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      handleError(err, setError);
    }
  }, []);

  const handleRoleChange = useCallback((userId: string, newRole: 'admin' | 'usuario') => {
    setUsers(prevUsers => prevUsers.map(user =>
      user.id === userId ? { ...user, rol: newRole } : user
    ));
    message.success(`Rol de usuario actualizado a ${newRole}`);
  }, []);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getAll(page, pageSize);
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
      handleError(err, setError);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (userToDelete) {
      try {
        if (currentUser && currentUser.id === userToDelete.id) {
          throw new Error('No puedes eliminar tu propia cuenta.');
        }

        await userService.delete(userToDelete.id);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        message.success('Usuario eliminado exitosamente');
      } catch (error) {
        handleError(error, setError);
      }
    }
  }, [userToDelete, currentUser]);

  const handleCreateUser = useCallback(async (userData: FormData) => {
    try {
      const newUser = await userService.create(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      setCreateDialogOpen(false);
      message.success('Usuario creado exitosamente');
    } catch (error) {
      handleError(error, setError);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [fetchUsers, pagination.current, pagination.pageSize]);

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
              <StyledCard elevation={3} isCurrentUser={currentUser?.id === user.id}>
                <StyledCardContent>
                  <StyledAvatar
                    src={user.foto || undefined}
                    alt={`${user.nombre} ${user.apellidos}`}
                  />
                  <StyledUserName variant={isSmallScreen ? "subtitle1" : "h6"}>
                    {user.nombre} {user.apellidos}
                    {currentUser?.id === user.id && (
                      <StyledCurrentUserChip label="Tú" color="primary" size="small" />
                    )}
                  </StyledUserName>
                  <StyledUserInfo variant="body2" color="text.secondary">
                    Email: {user.email}
                  </StyledUserInfo>
                  <Box sx={{
                    marginBottom: theme.spacing(1),
                    textAlign: 'center',
                    ...theme.typography.body2,
                    color: theme.palette.text.secondary
                  }}>
                    Rol: <Chip label={user.rol} color={user.rol === 'admin' ? 'secondary' : 'default'} size="small" />
                  </Box>
                </StyledCardContent>
                <StyledCardActions>
                  <ChangeUserRole
                    userId={user.id}
                    currentRole={user.rol}
                    onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
                    disabled={currentUser?.id === user.id}
                  />
                  <StyledCreateButton
                    size="small"
                    color="secondary"
                    fullWidth={isSmallScreen}
                    onClick={() => {
                      setUserToDelete(user);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={currentUser?.id === user.id}
                  >
                    Eliminar
                  </StyledCreateButton>
                </StyledCardActions>
              </StyledCard>
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

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        itemName={userToDelete ? `${userToDelete.nombre} ${userToDelete.apellidos}` : ''}
      />

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <CreateUserForm onSubmit={handleCreateUser} onCancel={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </StyledBox>
  );
};

export default UserList;
