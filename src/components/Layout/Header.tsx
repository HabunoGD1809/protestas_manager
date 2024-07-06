import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          Protestas App
        </Typography>
        <Box>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/protestas" sx={{ mr: 1 }}>
                Protestas
              </Button>
              <Button color="inherit" component={RouterLink} to="/cabecillas" sx={{ mr: 1 }}>
                Cabecillas
              </Button>
              <Button color="inherit" component={RouterLink} to="/naturalezas" sx={{ mr: 1 }}>
                Naturalezas
              </Button>
              <Button color="secondary" variant="contained" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login" sx={{ mr: 1 }}>
                Login
              </Button>
              <Button color="secondary" variant="contained" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
