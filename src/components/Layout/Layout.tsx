import React from 'react';
import { Container, Box, CssBaseline } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Header />
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ backgroundColor: 'white', borderRadius: 2, padding: 3, boxShadow: 1 }}>
          {children}
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
