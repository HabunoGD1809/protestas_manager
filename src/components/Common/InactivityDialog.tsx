import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface InactivityDialogProps {
  open: boolean;
  onKeepActive: () => void;
  onLogout: () => void;
}

const InactivityDialog: React.FC<InactivityDialogProps> = ({
  open,
  onKeepActive,
  onLogout,
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle>¿Desea mantener la sesión activa?</DialogTitle>
      <DialogContent>
        <Typography>
          Su sesión se cerrará pronto debido a inactividad.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="secondary">
          Cerrar sesión
        </Button>
        <Button onClick={onKeepActive} color="primary" autoFocus>
          Mantener sesión activa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InactivityDialog;
