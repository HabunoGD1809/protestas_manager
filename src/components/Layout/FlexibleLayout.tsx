import React, { ReactNode } from 'react';
import { Container, Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface FlexibleLayoutProps {
   children: ReactNode;
   maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
   containerMaxWidth?: number | string;
}

const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({
   children,
   maxWidth = 'sm',
   containerMaxWidth = '500px'
}) => {
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
   const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

   const getMaxWidth = () => {
      if (isMobile) return 'sm';
      if (isTablet) return 'md';
      return maxWidth;
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
                  maxWidth: containerMaxWidth,
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

export default FlexibleLayout;
