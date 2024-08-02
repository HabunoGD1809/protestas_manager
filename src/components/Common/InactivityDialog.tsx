import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface InactivityDialogProps {
  open: boolean;
  onKeepActive: () => void;
  onLogout: () => void;
}

const InactivityDialog: React.FC<InactivityDialogProps> = ({ open, onKeepActive, onLogout }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open) {
      setCountdown(60);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open, onLogout]);

  const handleKeepActive = () => {
    setCountdown(60);
    onKeepActive();
  };

  return (
    <Dialog open={open}>
      <DialogTitle>¿Desea mantener la sesión activa?</DialogTitle>
      <DialogContent>
        <Typography>
          Su sesión se cerrará en {countdown} segundos debido a inactividad.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="secondary">
          Cerrar sesión
        </Button>
        <Button onClick={handleKeepActive} color="primary" autoFocus>
          Mantener sesión activa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InactivityDialog;
