import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  IconButton,
  Button,
  Typography,
  Box,
  Divider,
  useTheme
} from '@mui/material';
import * as IconoirIcons from 'iconoir-react';
import SearchIcon from '@mui/icons-material/Search';

interface IconSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

interface IconoirIconComponent extends React.FC<React.SVGProps<SVGSVGElement>> { }

const IconSelector: React.FC<IconSelectorProps> = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const itemsPerPage = 100;
  const theme = useTheme();

  const iconList = useMemo(() => {
    return Object.keys(IconoirIcons).filter(key =>
      key.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const paginatedIcons = iconList.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Seleccionar un Icono
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar iconos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
        </Box>
        <Box sx={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          p: 2
        }}>
          <Grid container spacing={1}>
            {paginatedIcons.map((iconName) => {
              const Icon = IconoirIcons[iconName as keyof typeof IconoirIcons] as IconoirIconComponent;
              return (
                <Grid item key={iconName}>
                  <IconButton
                    onClick={() => handleSelect(iconName)}
                    title={iconName}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Icon />
                  </IconButton>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Mostrando {paginatedIcons.length} de {iconList.length} iconos
          </Typography>
          <Box>
            <Button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              sx={{ mr: 1 }}
            >
              Anterior
            </Button>
            <Button
              disabled={(page + 1) * itemsPerPage >= iconList.length}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default IconSelector;
