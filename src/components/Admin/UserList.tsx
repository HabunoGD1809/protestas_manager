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
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { User } from '../../types/types';
import ChangeUserRole from './ChangeUserRole';
import Pagination from '../Common/Pagination';
import { userService, getFullImageUrl } from '../../services/apiService';
import CreateUserForm from './CreateUserForm';
import { cacheService } from '../../services/cacheService';
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
      // Intentar obtener datos del caché
      const cachedData = cacheService.get<{ users: User[], pagination: typeof pagination }>(cacheKey);

      if (cachedData) {
        setUsers(cachedData.users);
        setPagination(cachedData.pagination);
        setIsLoading(false);

        // Actualizar en segundo plano
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
                    Correo: {user.email}
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
                    onClick={() => handleDeleteUser(user)}
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
