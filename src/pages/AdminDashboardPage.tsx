import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid'; 
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { ResumenPrincipal, ProtestasRecientes } from '../types';

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const { loading, error, request } = useApi();
  const [dashboardData, setDashboardData] = useState<ResumenPrincipal | null>(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await request<ResumenPrincipal>('get', '/pagina-principal');
      // console.log('Fetched dashboard data:', data); // no borrar
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  fetchData();
}, [request]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const statCards = [
    { icon: <FlagIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />, count: dashboardData.totales.protestas, label: 'Protestas', link: '/protestas' },
    { icon: <PersonIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />, count: dashboardData.totales.usuarios, label: 'Usuarios', link: '/usuarios' },
    { icon: <NatureIcon fontSize="large" sx={{ color: theme.palette.success.main }} />, count: dashboardData.totales.naturalezas, label: 'Naturalezas', link: '/naturalezas' },
    { icon: <PersonIcon fontSize="large" sx={{ color: theme.palette.error.main }} />, count: dashboardData.totales.cabecillas, label: 'Cabecillas', link: '/cabecillas' },
  ];

  const protestasRecentesColumns: GridColDef<ProtestasRecientes>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'nombre', headerName: 'Nombre', width: 200 },
  { 
    field: 'fecha_evento', 
    headerName: 'Fecha Evento', 
    width: 130, 
    valueGetter: (params: GridValueGetterParams<ProtestasRecientes>) => {
      if (params.value) {
        try {
          return new Date(params.value).toLocaleDateString();
        } catch (error) {
          console.error('Error parsing fecha_evento:', error);
          return 'Invalid Date';
        }
      }
      return 'N/A';
    }
  },
  { 
    field: 'fecha_creacion', 
    headerName: 'Fecha Creación', 
    width: 130, 
    valueGetter: (params: GridValueGetterParams<ProtestasRecientes>) => {
      if (params.value) {
        try {
          return new Date(params.value).toLocaleDateString();
        } catch (error) {
          console.error('Error parsing fecha_creacion:', error);
          return 'Invalid Date';
        }
      }
      return 'N/A';
    }
  },
  {
    field: 'actions',
    headerName: 'Acciones',
    width: 120,
    renderCell: (params: GridRenderCellParams<ProtestasRecientes>) => (
      <Button
        component={RouterLink}
        to={`/protestas/${params.id || ''}`}
        variant="outlined"
        size="small"
        disabled={!params.id}
      >
        Ver Detalles
      </Button>
    ),
  },
];

  const protestasPorNaturalezaData = Object.entries(dashboardData.protestas_por_naturaleza).map(([name, value]) => ({ name, value }));
  const protestasPorProvinciaData = Object.entries(dashboardData.protestas_por_provincia).map(([name, value]) => ({ name, value }));
  const protestasUltimos30DiasData = Object.entries(dashboardData.protestas_ultimos_30_dias).map(([date, count]) => ({ date, count: Number(count) }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Administración
      </Typography>
      
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
                  {protestasPorNaturalezaData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <YAxis />
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
                <YAxis />
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
                    <TableCell>Nombre</TableCell><TableCell align="right">Protestas Creadas</TableCell>
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
