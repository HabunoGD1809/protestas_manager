import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography, Grid, Paper, Box, Button, useTheme,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Person as PersonIcon,
  Nature as NatureIcon,
  Flag as FlagIcon,
  List as ListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, YAxisProps
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { ResumenPrincipal } from '../types/types';
import { resumenService } from '../services/apiService';
import { cacheService } from '../services/cacheService';
import { useSnackbar } from 'notistack';

const CACHE_KEY = 'resumen_principal';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const { loading, error } = useApi();
  const [dashboardData, setDashboardData] = useState<ResumenPrincipal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchData = useCallback(async (force = false) => {
    try {
      if (!force) {
        const cachedData = cacheService.get<ResumenPrincipal>(CACHE_KEY);
        if (cachedData) {
          setDashboardData(cachedData);
          return;
        }
      }

      setRefreshing(true);
      const newData = await resumenService.getPaginaPrincipal();
      setDashboardData(newData);

      cacheService.setConfig({ cacheDuration: CACHE_DURATION });
      cacheService.set(CACHE_KEY, newData);

      setRefreshing(false);

      if (force) {
        enqueueSnackbar('Datos actualizados correctamente', { variant: 'success' });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setRefreshing(false);
      if (force) {
        enqueueSnackbar('Error al actualizar los datos', { variant: 'error' });
      }
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      fetchData(true);
    };

    window.addEventListener('potentialDataUpdate', handlePotentialDataUpdate);

    return () => {
      window.removeEventListener('potentialDataUpdate', handlePotentialDataUpdate);
    };
  }, [fetchData]);

  const protestasRecentesColumns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 220 },
    { field: 'nombre', headerName: 'Nombre', width: 200 },
    { field: 'fecha_evento', headerName: 'Fecha Evento', width: 130 },
    { field: 'fecha_creacion', headerName: 'Fecha Creación', width: 130 },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      renderCell: (params) => (
        <Button
          component={RouterLink}
          to={`/protestas/${params.id}`}
          variant="outlined"
          size="small"
        >
          Ver Detalles
        </Button>
      ),
    },
  ], []);

  const statCards = useMemo(() => [
    { icon: <FlagIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />, count: dashboardData?.totales.protestas, label: 'Protestas', link: '/protestas' },
    { icon: <PersonIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />, count: dashboardData?.totales.usuarios, label: 'Usuarios', link: '/usuarios' },
    { icon: <NatureIcon fontSize="large" sx={{ color: theme.palette.success.main }} />, count: dashboardData?.totales.naturalezas, label: 'Naturalezas', link: '/naturalezas' },
    { icon: <PersonIcon fontSize="large" sx={{ color: theme.palette.error.main }} />, count: dashboardData?.totales.cabecillas, label: 'Cabecillas', link: '/cabecillas' },
  ], [theme, dashboardData]);

  const protestasPorNaturalezaData = useMemo(() =>
    dashboardData ? Object.entries(dashboardData.protestas_por_naturaleza).map(([name, value]) => ({ name, value })) : [],
    [dashboardData]);

  const protestasPorProvinciaData = useMemo(() =>
    dashboardData ? Object.entries(dashboardData.protestas_por_provincia).map(([name, value]) => ({ name, value })) : [],
    [dashboardData]);

  const protestasUltimos30DiasData = useMemo(() =>
    dashboardData ? Object.entries(dashboardData.protestas_ultimos_30_dias).map(([date, count]) => ({ date, count: Number(count) })) : [],
    [dashboardData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const CustomYAxis: React.FC<YAxisProps> = (props) => (
    <YAxis
      allowDecimals={false}
      allowDataOverflow={false}
      domain={['auto', 'auto']}
      {...props}
    />
  );

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => fetchData(true)} sx={{ mt: 2 }}>Reintentar</Button>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box m={2}>
        <Alert severity="info">No se pudo cargar la información del dashboard.</Alert>
        <Button onClick={() => fetchData(true)} sx={{ mt: 2 }}>Reintentar</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Panel de Administración
        </Typography>
        <Button
          onClick={() => fetchData(true)}
          startIcon={<RefreshIcon />}
          disabled={refreshing}
        >
          {refreshing ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              {card.icon}
              <Typography variant="h4" sx={{ my: 2 }}>{card.count}</Typography>
              <Typography variant="subtitle1">{card.label}</Typography>
              <Button component={RouterLink} to={card.link} startIcon={<ListIcon />} sx={{ mt: 'auto' }}>
                Ver {card.label}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Protestas por Naturaleza</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protestasPorNaturalezaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {protestasPorNaturalezaData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Protestas por Provincia</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protestasPorProvinciaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <CustomYAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Protestas en los últimos 30 días</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={protestasUltimos30DiasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <CustomYAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={theme.palette.secondary.main} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top 5 Cabecillas más Activos</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Total Protestas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.top_cabecillas.map((cabecilla, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">{cabecilla.nombre}</TableCell>
                      <TableCell align="right">{cabecilla.total_protestas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Usuarios más Activos</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Protestas Creadas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.usuarios_activos.map((usuario, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">{usuario.nombre}</TableCell>
                      <TableCell align="right">{usuario.protestas_creadas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Protestas Recientes
        </Typography>
        <DataGrid
          rows={dashboardData.protestas_recientes}
          columns={protestasRecentesColumns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 5, page: 0 },
            },
          }}
          pageSizeOptions={[5]}
          autoHeight
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
