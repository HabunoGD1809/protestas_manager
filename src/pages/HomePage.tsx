import React from 'react';
import { Typography, Button, Box, Card, CardContent, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bienvenido a la aplicación Protestas
      </Typography>
      {user ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Protestas
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Ver y gestionar protestas.
                </Typography>
                <Button component={RouterLink} to="/protestas" variant="contained" color="primary" fullWidth>
                  Ver Protestas
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cabecillas
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Gestionar líderes de protesta.
                </Typography>
                <Button component={RouterLink} to="/cabecillas" variant="contained" color="primary" fullWidth>
                  Ver Cabecillas
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Naturalezas
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Gestionar tipos de protesta.
                </Typography>
                <Button component={RouterLink} to="/naturalezas" variant="contained" color="primary" fullWidth>
                  Ver Naturalezas
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body1" paragraph>
              Por favor, inicie sesión o regístrese para usar la aplicación.
            </Typography>
            <Box sx={{ '& > :not(style)': { m: 1 } }}>
              <Button component={RouterLink} to="/login" variant="contained" color="primary">
                Iniciar sesión              </Button>
              <Button component={RouterLink} to="/register" variant="contained" color="secondary">
                Registrarse
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HomePage;
