import React from 'react';
import { Alert } from '@mui/material';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return <Alert severity="error">{message}</Alert>;
};

export default ErrorMessage;
