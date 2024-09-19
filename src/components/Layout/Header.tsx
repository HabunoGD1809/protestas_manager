import React, { useContext, useState, useCallback, memo } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem, IconButton, Tooltip, Container } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import FlagIcon from '@mui/icons-material/Flag';
import GroupIcon from '@mui/icons-material/Group';
import CategoryIcon from '@mui/icons-material/Category';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CampaignIcon from '@mui/icons-material/Campaign';
import { AuthContext } from '../../contexts/AuthContext';

const Header: React.FC = memo(() => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOpenNavMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  }, []);

  const handleOpenUserMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  }, []);

  const handleCloseNavMenu = useCallback(() => {
    setAnchorElNav(null);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setAnchorElUser(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    handleCloseUserMenu();
  }, [logout, handleCloseUserMenu]);

  const handleProfileClick = useCallback(() => {
    handleCloseUserMenu();
    navigate('/perfil');
  }, [handleCloseUserMenu, navigate]);

  const menuItems = React.useMemo(() => user ? [
    { text: 'Inicio', path: '/', icon: <HomeIcon /> },
    { text: 'Protestas', path: '/protestas', icon: <FlagIcon /> },
    { text: 'Cabecillas', path: '/cabecillas', icon: <GroupIcon /> },
    { text: 'Naturalezas', path: '/naturalezas', icon: <CategoryIcon /> },
    ...(isAdmin ? [
      { text: 'Usuarios', path: '/usuarios', icon: <PeopleIcon /> },
      { text: 'Dashboard Admin', path: '/admin/dashboard', icon: <AnalyticsIcon /> }
    ] : []),
  ] : [], [user, isAdmin]);

  React.useEffect(() => {
    handleCloseNavMenu();
    handleCloseUserMenu();
  }, [handleCloseNavMenu, handleCloseUserMenu, location]);

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <CampaignIcon sx={{ mr: 1 }} />
            PROTESTAS
          </Typography>

          {user && (
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {menuItems.map((item) => (
                  <MenuItem key={item.text} onClick={handleCloseNavMenu} component={RouterLink} to={item.path}>
                    {item.icon}
                    <Typography textAlign="center" sx={{ ml: 1 }}>{item.text}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 500,
              letterSpacing: '.5rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            PROTESTAS
          </Typography>
          {user && (
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  onClick={handleCloseNavMenu}
                  sx={{
                    my: 0.02,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mx: 1,
                    transition: 'all 0.3s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  {item.icon}
                  <Typography variant="caption" sx={{ mt: 0.5 }}>{item.text}</Typography>
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 0 }}>
            {user ? (
              <>
                <Tooltip title="Abrir opciones">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      alt={`${user.nombre} ${user.apellidos}`}
                      src={user.foto || undefined}
                      sx={{ width: 40, height: 40 }}
                    >
                      {!user.foto && `${user.nombre[0]}${user.apellidos[0]}`}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={handleProfileClick}>
                    <AccountCircleIcon sx={{ mr: 1 }} />
                    <Typography textAlign="center">Perfil</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Salir</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                color="primary"
                component={RouterLink}
                to="/login"
                sx={{
                  mr: 1,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  padding: '8px 16px',
                  boxShadow: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#1565C0',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    backgroundColor: '#0D47A1',
                    transform: 'translateY(1px)',
                  },
                }}
              >
                Iniciar sesión
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
});

export default Header;
