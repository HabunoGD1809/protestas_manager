import React from 'react';
import { Typography, Box } from '@mui/material';
import ProtestaDetail from '../components/Protesta/ProtestaDetail';

const ProtestaDetailPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Protesta Details
      </Typography>
      <ProtestaDetail />
    </Box>
  );
};

export default ProtestaDetailPage;
