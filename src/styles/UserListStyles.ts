import { styled } from '@mui/material/styles';
import { Box, Button, Card, CardActions, CardContent, Avatar, Typography, Chip } from '@mui/material';

export const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

export const StyledErrorAlert = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledCreateButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isCurrentUser',
})<{ isCurrentUser?: boolean }>(({ theme, isCurrentUser }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  ...(isCurrentUser && {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: theme.shadows[6],
  }),
}));

export const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[3],
  [theme.breakpoints.down('sm')]: {
    width: 80,  
    height: 80,
  },
}));

export const StyledUserName = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(1),
  fontWeight: 'bold',
  [theme.breakpoints.down('sm')]: {
    fontSize: theme.typography.subtitle1.fontSize,
  },
}));

export const StyledUserInfo = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  textAlign: 'center',
}));

export const StyledCardActions = styled(CardActions)(({ theme }) => ({
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

export const StyledPaginationContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  display: 'flex',
  justifyContent: 'center',
}));

export const StyledNoUsersText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(3),
}));

export const StyledLoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
});

export const StyledCurrentUserChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  verticalAlign: 'middle',
}));
