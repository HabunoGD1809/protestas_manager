import React from 'react';
import { Typography, Button, Box, Card, CardContent, Grid, Container, Paper, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtestIcon from '@mui/icons-material/Gavel';
import LeaderIcon from '@mui/icons-material/People';
import NatureIcon from '@mui/icons-material/Category';
import LoginIcon from '@mui/icons-material/Login';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            Bienvenido a la aplicación Protestas
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Gestiona y monitorea protestas de manera eficiente
          </Typography>
        </Paper>

        {user ? (
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {[
              { title: 'Protestas', description: 'Ver y gestionar protestas', icon: <ProtestIcon />, link: '/protestas' },
              { title: 'Cabecillas', description: 'Gestionar líderes de protesta', icon: <LeaderIcon />, link: '/cabecillas' },
              { title: 'Naturalezas', description: 'Gestionar tipos de protesta', icon: <NatureIcon />, link: '/naturalezas' },
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mb: 2 }}>
                      {item.icon}
                    </Avatar>
                    <Typography variant="h5" component="div" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                  </CardContent>
                  <Button component={RouterLink} to={item.link} variant="contained" color="primary" fullWidth sx={{ mt: 'auto', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    Ver {item.title}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card sx={{ mt: 4, p: 2, textAlign: 'center' }}>
            <CardContent>
              <Avatar sx={{ bgcolor: 'primary.main', m: 'auto', mb: 2 }}>
                <LoginIcon />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                Acceso a la aplicación
              </Typography>
              <Typography variant="body1" paragraph>
                Por favor, inicie sesión para usar la aplicación.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ mt: 2 }}
              >
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;
