import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { User, UserListResponse } from '../../types';
import Pagination from '../Common/Pagination';
import ChangeUserRole from './ChangeUserRole';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
   const { request, loading, error } = useApi();
   
     const handleRoleChange = (userId: string, newRole: 'admin' | 'usuario') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, rol: newRole } : user
    ));
  };

  const fetchUsers = async (page: number, pageSize: number) => {
    try {
      const data = await request<UserListResponse>('get', '/usuarios', { params: { page, page_size: pageSize } });
      setUsers(data.items);
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, []);

  const handlePaginationChange = (page: number, pageSize?: number) => {
    fetchUsers(page, pageSize || pagination.pageSize);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellidos</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar src={user.foto || undefined} alt={`${user.nombre} ${user.apellidos}`} />
                </TableCell>
                <TableCell>{user.nombre}</TableCell>
                <TableCell>{user.apellidos}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.rol}</TableCell>
                <TableCell>
                  <ChangeUserRole
                    userId={user.id}
                    currentRole={user.rol}
                    onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        current={pagination.current}
        total={pagination.total}
        pageSize={pagination.pageSize}
        onChange={handlePaginationChange}
      />
    </>
  );
};

export default UserList;
