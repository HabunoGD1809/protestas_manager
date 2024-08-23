import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface InactivityDialogProps {
  open: boolean;
  onKeepActive: () => void;
  onLogout: () => void;
  countdownDuration: number;
}

  const InactivityDialog: React.FC<InactivityDialogProps> = ({
  open,
  onKeepActive,
  onLogout,
  countdownDuration,
}) => {
  const [countdown, setCountdown] = useState(countdownDuration);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      onLogout();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, countdown, onLogout]);

  useEffect(() => {
    if (open) {
      setCountdown(countdownDuration);
    }
  }, [open, countdownDuration]);

  const handleKeepActive = () => {
    try {
      onKeepActive();
    } catch (error) {
      console.error('Error al mantener la sesión activa:', error);
      onLogout(); // Si hay un error, cerramos la sesión por seguridad
    }
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
