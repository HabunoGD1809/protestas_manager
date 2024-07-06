import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 3, bgcolor: 'background.paper' }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Protestas App. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
