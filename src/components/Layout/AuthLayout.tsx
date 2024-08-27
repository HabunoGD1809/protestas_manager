import React, { ReactNode } from 'react';
import { Container, Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface AuthLayoutProps {
   children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
   const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

   const getMaxWidth = () => {
      if (isMobile) return 'sm';
      if (isTablet) return 'md';
      return 'md';
   };

   return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
         <CssBaseline />
         <Header />
         <Container
            component="main"
            maxWidth={getMaxWidth()}
            sx={{
               mt: { xs: 3, sm: 4 },
               mb: { xs: 3, sm: 4 },
               flexGrow: 1,
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
            }}
         >
            <Box
               sx={{
                  backgroundColor: 'white',
                  borderRadius: 2,
                  padding: { xs: 2, sm: 3 },
                  boxShadow: 1,
                  width: '100%',
                  maxWidth: '500px', // Ajusta el ancho máximo del contenedor
                  overflowX: 'hidden',
               }}
            >
               {children}
            </Box>
         </Container>
         <Footer />
      </Box>
   );
};

export default AuthLayout;
