import React from 'react';
import { Box, Container, Typography, useTheme, alpha } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';

const Footer: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: 2,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        // boxShadow: '0px -10px 20px rgba(0,0,0,0.1), 0px -5px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="space-around"
          alignItems="center"
          sx={{
            '& > div': {
              transition: 'transform 0.3s ease-in-out, filter 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                filter: 'drop-shadow(0 5px 15px rgba(255,255,255,0.3))',
              },
            },
          }}
        >
          <Box display="flex" alignItems="center" flexDirection="column">
            <WarningIcon sx={{ fontSize: 32, color: '#FFE900' }} />
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
              Uso Responsable
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" flexDirection="column">
            <SecurityIcon sx={{ fontSize: 32, color: '#' }} />
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
              Datos Seguros
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" flexDirection="column">
            <CodeIcon sx={{ fontSize: 32, color: '#FB8F00' }} />
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>
              Código Abierto
            </Typography>
          </Box>
        </Box>
        <Box
          mt={0.5}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.primary.contrastText, 0.2)}`,
            pt: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            © {new Date().getFullYear()} App Protestas
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Versión 1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
