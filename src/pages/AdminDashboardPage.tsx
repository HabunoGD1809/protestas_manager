import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Typography, Grid, Paper, Box, Button } from '@mui/material';
import { Person as PersonIcon, Nature as NatureIcon, Flag as FlagIcon, List as ListIcon } from '@mui/icons-material';
import { resumenService, userService, naturalezaService, cabecillaService } from '../services/api';
import { ResumenPrincipal } from '../types';

const AdminDashboardPage: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenPrincipal | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [naturalezaCount, setNaturalezaCount] = useState<number>(0);
  const [cabecillaCount, setCabecillaCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumenData = await resumenService.getPaginaPrincipal();
        setResumen(resumenData);

        const userData = await userService.getAll(1, 1);
        setUserCount(userData.total);

        const naturalezaData = await naturalezaService.getAll(1, 1);
        setNaturalezaCount(naturalezaData.total);

        const cabecillaData = await cabecillaService.getAll(1, 1);
        setCabecillaCount(cabecillaData.total);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Administración
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PersonIcon fontSize="large" color="primary" />
            <Typography variant="h6">{userCount}</Typography>
            <Typography variant="subtitle1">Usuarios</Typography>
            <Button component={RouterLink} to="/usuarios" startIcon={<ListIcon />}>
              Ver Usuarios
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FlagIcon fontSize="large" color="secondary" />
            <Typography variant="h6">{resumen?.total_protestas || 0}</Typography>
            <Typography variant="subtitle1">Protestas</Typography>
            <Button component={RouterLink} to="/protestas" startIcon={<ListIcon />}>
              Ver Protestas
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <NatureIcon fontSize="large" color="success" />
            <Typography variant="h6">{naturalezaCount}</Typography>
            <Typography variant="subtitle1">Naturalezas</Typography>
            <Button component={RouterLink} to="/naturalezas" startIcon={<ListIcon />}>
              Ver Naturalezas
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PersonIcon fontSize="large" color="error" />
            <Typography variant="h6">{cabecillaCount}</Typography>
            <Typography variant="subtitle1">Cabecillas</Typography>
            <Button component={RouterLink} to="/cabecillas" startIcon={<ListIcon />}>
              Ver Cabecillas
            </Button>
          </Paper>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Protestas Recientes
        </Typography>
        {resumen?.protestas_recientes && resumen.protestas_recientes.length > 0 ? (
          <Grid container spacing={2}>
            {resumen.protestas_recientes.map((protesta) => (
              <Grid item xs={12} sm={6} md={4} key={protesta.id}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6">{protesta.nombre}</Typography>
                  <Typography variant="body2">Fecha: {protesta.fecha_evento}</Typography>
                  <Button 
                    component={RouterLink} 
                    to={`/protestas/${protesta.id}`} variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                  >
                    Ver Detalles
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1">No hay protestas recientes para mostrar.</Typography>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
