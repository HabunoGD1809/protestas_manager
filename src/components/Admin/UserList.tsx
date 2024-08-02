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
  useMediaQuery
} from '@mui/material';
import { User, UserListResponse } from '../../types';
import { useApi } from '../../hooks/useApi';
import ChangeUserRole from './ChangeUserRole';
import Pagination from '../Common/Pagination';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { request, loading, error } = useApi();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRoleChange = useCallback((userId: string, newRole: 'admin' | 'usuario') => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, rol: newRole } : user
    ));
  }, []);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    try {
      const data = await request<UserListResponse>('get', '/usuarios', { params: { page, page_size: pageSize } });

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
        setUsers(data.items);
        setPagination(prev => ({
          ...prev,
          current: data.page || prev.current,
          pageSize: data.page_size || prev.pageSize,
          total: data.total || data.items.length
        }));
      } else {
        console.error('Unexpected data structure:', data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, [fetchUsers, pagination, pagination.pageSize]);

  const handlePaginationChange = useCallback((page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
  }, []);

 if (isInitialLoading || loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ padding: theme.spacing(isSmallScreen ? 1 : 2) }}>
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
                <Button size="small" color="primary" fullWidth={isSmallScreen}>
                  Ver Perfil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {users.length === 0 && (
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
    </Box>
  );
};

export default UserList;
