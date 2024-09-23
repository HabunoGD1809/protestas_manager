import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Grid, IconButton, Button, Box, Typography } from '@mui/material';
import * as IconoirIcons from 'iconoir-react';

const ICONS_PER_PAGE = 25;

type IconName = keyof typeof IconoirIcons;

interface IconoirIconObject {
  render: () => React.ReactElement;
}

const IconSelector = ({ open, onClose, onSelect }: {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allIcons = useMemo(() => {
    return Object.keys(IconoirIcons).filter(key => {
      const icon = IconoirIcons[key as IconName];
      return typeof icon === 'object' && icon !== null && 'render' in icon;
    }) as IconName[];
  }, []);

  const filteredIcons = useMemo(() => {
    return allIcons.filter(iconName =>
      iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allIcons, searchTerm]);

  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);

  const displayedIcons = useMemo(() => {
    const startIndex = (currentPage - 1) * ICONS_PER_PAGE;
    return filteredIcons.slice(startIndex, startIndex + ICONS_PER_PAGE);
  }, [filteredIcons, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleIconSelect = (iconName: IconName) => {
    onSelect(iconName);
    onClose();
  };

  const renderIcon = (iconName: IconName): React.ReactElement | null => {
    const IconObject = IconoirIcons[iconName] as unknown as IconoirIconObject;
    if (IconObject && typeof IconObject === 'object' && 'render' in IconObject) {
      return IconObject.render();
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Seleccionar Icono</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar icono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          margin="normal"
        />
        <Typography variant="body2">Total de iconos: {allIcons.length}</Typography>
        <Grid container spacing={1}>
          {displayedIcons.map((iconName) => (
            <Grid item key={iconName}>
              <IconButton onClick={() => handleIconSelect(iconName)} title={iconName}>
                {renderIcon(iconName)}
              </IconButton>
              <Typography variant="caption">{iconName}</Typography>
            </Grid>
          ))}
        </Grid>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Anterior
          </Button>
          <Box mx={2}>
            Página {currentPage} de {totalPages}
          </Box>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Siguiente
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default IconSelector;
