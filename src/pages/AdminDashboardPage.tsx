import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  Typography, Grid, Box, Button, useTheme,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CardHeader, Avatar, TextField
} from '@mui/material';
import {
  Person as PersonIcon,
  Nature as NatureIcon,
  Flag as FlagIcon,
  List as ListIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LabelList
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { ResumenPrincipal } from '../types/types';
import { resumenService } from '../services/apiService';
import { useSnackbar } from 'notistack';

const COLORS = ['#3f51b5', '#f50057', '#00bcd4', '#ff9800', '#4caf50', '#9c27b0', '#ffeb3b'];

const AdminDashboardPage: React.FC = () => {
  const theme = useTheme();
  const { loading, error } = useApi();
  const [dashboardData, setDashboardData] = useState<ResumenPrincipal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const componentRef = useRef(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      setRefreshing(true);
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      const newData = await resumenService.getPaginaPrincipal(formattedStartDate, formattedEndDate);
      setDashboardData(newData);
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
  }, [enqueueSnackbar, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const protestasRecentesColumns: GridColDef[] = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 220 },
    { field: 'nombre', headerName: 'Nombre', width: 200, flex: 1 },
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
    { icon: <FlagIcon fontSize="large" />, count: dashboardData?.totales.protestas, label: 'Protestas', link: '/protestas', color: theme.palette.primary.main },
    { icon: <PersonIcon fontSize="large" />, count: dashboardData?.totales.usuarios, label: 'Usuarios', link: '/usuarios', color: theme.palette.secondary.main },
    { icon: <NatureIcon fontSize="large" />, count: dashboardData?.totales.naturalezas, label: 'Naturalezas', link: '/naturalezas', color: theme.palette.success.main },
    { icon: <PersonIcon fontSize="large" />, count: dashboardData?.totales.cabecillas, label: 'Cabecillas', link: '/cabecillas', color: theme.palette.error.main },
  ], [theme, dashboardData]);

  const protestasPorNaturalezaData = useMemo(() => {
    if (!dashboardData) return [];
    const data = Object.entries(dashboardData.protestas_por_naturaleza)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: ((item.value / total) * 100).toFixed(1)
    }));
  }, [dashboardData]);

  const protestasPorProvinciaData = useMemo(() =>
    dashboardData ? Object.entries(dashboardData.protestas_por_provincia)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) : [],
    [dashboardData]);

  const protestasUltimos30DiasData = useMemo(() =>
    dashboardData ? Object.entries(dashboardData.protestas_por_dia).map(([date, count]) => ({ date, count: Number(count) })) : [],
    [dashboardData]);

  const PrintableContent = React.forwardRef<HTMLDivElement>((_props, ref) => (
    <div ref={ref} style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Panel de Administración - Reporte</Typography>
      <Typography variant="subtitle1" gutterBottom>
        Fecha y hora del reporte: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        {statCards.map((card, index) => (
          <Grid item xs={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">{card.label}</Typography>
                <Typography variant="h4">{card.count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        <Grid item xs={6}>
          <Card>
            <CardHeader title="Protestas por Naturaleza" />
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <PieChart width={400} height={300}>
                  <Pie
                    data={protestasPorNaturalezaData}
                    cx={200}
                    cy={150}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {protestasPorNaturalezaData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardHeader title="Protestas por Provincia" />
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <BarChart
                  width={400}
                  height={300}
                  data={protestasPorProvinciaData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={theme.palette.primary.main} name="Protestas">
                    <LabelList dataKey="value" position="right" />
                  </Bar>
                </BarChart>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Line Chart */}
      <Card style={{ marginBottom: '20px' }}>
        <CardHeader title="Protestas en el rango de fechas seleccionado" />
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <LineChart
              width={800}
              height={300}
              data={protestasUltimos30DiasData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke={theme.palette.secondary.main} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
        <Grid item xs={6}>
          <Card>
            <CardHeader title="Top Cabecillas más Activos" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Total Protestas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData?.top_cabecillas.map((cabecilla, index) => (
                      <TableRow key={index}>
                        <TableCell>{cabecilla.nombre}</TableCell>
                        <TableCell align="right">{cabecilla.total_protestas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardHeader title="Usuarios más Activos" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Protestas Creadas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData?.usuarios_activos.map((usuario, index) => (
                      <TableRow key={index}>
                        <TableCell>{usuario.nombre}</TableCell>
                        <TableCell align="right">{usuario.protestas_creadas}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Protestas Recientes */}
      <Card>
        <CardHeader title="Protestas Recientes" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Fecha Evento</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData?.protestas_recientes.map((protesta) => (
                  <TableRow key={protesta.id}>
                    <TableCell>{protesta.id}</TableCell>
                    <TableCell>{protesta.nombre}</TableCell>
                    <TableCell>{protesta.fecha_evento}</TableCell>
                    <TableCell>{protesta.fecha_creacion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  ));

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Dashboard Report',
    onBeforePrint: () => {
      // Cualquier preparación antes de imprimir
    },
    onAfterPrint: () => {
      enqueueSnackbar('Reporte impreso con éxito', { variant: 'success' });
    },
    pageStyle: `
      @media print {
        @page {
          size: landscape;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

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
    <Box sx={{
      flexGrow: 1,
      p: 3,
      backgroundColor: theme.palette.background.default,
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Panel de Administración
        </Typography>
        <Box display="flex" alignItems="center">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box display="flex" alignItems="center" mr={2}>
              <DatePicker
                label="Fecha de inicio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slots={{
                  textField: (params) => <TextField {...params} sx={{ mr: 2 }} />
                }}
              />
              <DatePicker
                label="Fecha de fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slots={{
                  textField: (params) => <TextField {...params} sx={{ mr: 2 }} />
                }}
              />
            </Box>
          </LocalizationProvider>
          <Button
            onClick={() => fetchData(true)}
            startIcon={<RefreshIcon />}
            disabled={refreshing}
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar datos'}
          </Button>
          <Button
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            variant="contained"
            color="secondary"
          >
            Imprimir Reporte
          </Button>
        </Box>
      </Box>

      {/* Regular dashboard content */}
      <div id="dashboard-content">
        <Grid container spacing={3} mb={4}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={3} sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: card.color, mb: 2 }}>
                    {card.icon}
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{card.count}</Typography>
                  <Typography variant="subtitle1" color="textSecondary">{card.label}</Typography>
                  <Button component={RouterLink} to={card.link} startIcon={<ListIcon />} sx={{ mt: 2 }} variant="outlined" color="primary">
                    Ver {card.label}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="Protestas por Naturaleza" />
              <CardContent sx={{ height: 450 }}>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={protestasPorNaturalezaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {protestasPorNaturalezaData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <Typography variant="subtitle1" align="center" sx={{ mt: 2 }}>
                  Total de protestas: <strong>{protestasPorNaturalezaData.reduce((sum, item) => sum + item.value, 0)}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="Protestas por Provincia" />
              <CardContent sx={{ height: 450 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={protestasPorProvinciaData}
                    margin={{
                      top: 5, right: 30, left: 20, bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => [`${value} protestas`, 'Cantidad']} />
                    <Legend />
                    <Bar dataKey="value" fill={theme.palette.primary.main} name="Protestas">
                      <LabelList dataKey="value" position="right" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader title="Protestas en el rango de fechas seleccionado" />
              <CardContent sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={protestasUltimos30DiasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke={theme.palette.secondary.main} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="Top 10 Cabecillas más Activos" />
              <CardContent>
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
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader title="Usuarios más Activos" />
              <CardContent>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card elevation={3}>
          <CardHeader title="Protestas Recientes" />
          <CardContent>
            <DataGrid
              rows={dashboardData.protestas_recientes}
              columns={protestasRecentesColumns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5, page: 0 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              autoHeight
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:hover': {
                  color: 'primary.main',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Hidden printable content */}
      <div style={{ display: 'none' }}>
        <PrintableContent ref={componentRef} />
      </div>
    </Box>
  );
};

export default AdminDashboardPage;
