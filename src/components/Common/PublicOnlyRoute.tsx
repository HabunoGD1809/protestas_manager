import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
