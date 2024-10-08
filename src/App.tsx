import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LayoutWrapper from './components/Layout/LayoutWrapper';
import AuthLayoutWrapper from './components/Layout/FlexibleLayoutWrapper';
import PrivateRoute from './components/Common/PrivateRoute';
import AdminRoute from './components/Common/AdminRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';
import PublicOnlyRoute from './components/Common/PublicOnlyRoute';
import CabecillaForm from './components/Cabecilla/CabecillaForm';
import FlexibleLayoutWrapper from './components/Layout/FlexibleLayoutWrapper';
import { useAuthErrorHandler } from './hooks/useAuthErrorHandler';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProtestaListPage = lazy(() => import('./pages/ProtestaListPage'));
const ProtestaFormPage = lazy(() => import('./pages/ProtestaFormPage'));
const ProtestaDetailPage = lazy(() => import('./pages/ProtestaDetailPage'));
const CabecillaListPage = lazy(() => import('./pages/CabecillaListPage'));
const CabecillaFormPage = lazy(() => import('./pages/CabecillaFormPage'));
const NaturalezaListPage = lazy(() => import('./pages/NaturalezaListPage'));
const NaturalezaFormPage = lazy(() => import('./pages/NaturalezaFormPage'));
const UserListPage = lazy(() => import('./pages/UserListPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => {
  const handleAuthError = useAuthErrorHandler();

  useEffect(() => {
    const handler = (event: CustomEvent<string>) => {
      handleAuthError(event);
    };

    window.addEventListener('auth-error', handler as EventListener);

    return () => {
      window.removeEventListener('auth-error', handler as EventListener);
    };
  }, [handleAuthError]);

  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LayoutWrapper><HomePage /></LayoutWrapper>} />
          <Route path="/login" element={<AuthLayoutWrapper><PublicOnlyRoute><LoginPage /></PublicOnlyRoute></AuthLayoutWrapper>} />
          <Route path="/perfil" element={<LayoutWrapper><PrivateRoute><UserProfilePage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/usuarios" element={<LayoutWrapper><AdminRoute><UserListPage /></AdminRoute></LayoutWrapper>} />
          <Route path="/protestas" element={<LayoutWrapper><PrivateRoute><ProtestaListPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/protestas/crear" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="600px"><PrivateRoute><ProtestaFormPage /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/protestas/:id" element={<LayoutWrapper><PrivateRoute><ProtestaDetailPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/protestas/editar/:id" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="600px"><PrivateRoute><ProtestaFormPage /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/cabecillas/:id" element={<LayoutWrapper><PrivateRoute><CabecillaFormPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/cabecillas/new" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="500px"><PrivateRoute><CabecillaFormPage /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/cabecillas" element={<LayoutWrapper><PrivateRoute><CabecillaListPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/cabecillas/edit/:id" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="500px"><PrivateRoute><CabecillaForm /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/naturalezas/:id" element={<LayoutWrapper><PrivateRoute><NaturalezaFormPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/naturalezas" element={<LayoutWrapper><PrivateRoute><NaturalezaListPage /></PrivateRoute></LayoutWrapper>} />
          <Route path="/naturalezas/new" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="500px"><PrivateRoute><NaturalezaFormPage /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/naturalezas/edit/:id" element={<FlexibleLayoutWrapper maxWidth="sm" containerMaxWidth="500px"><PrivateRoute><NaturalezaFormPage /></PrivateRoute></FlexibleLayoutWrapper>} />
          <Route path="/admin/dashboard" element={<LayoutWrapper><AdminRoute><AdminDashboardPage /></AdminRoute></LayoutWrapper>} />
          <Route path="*" element={<LayoutWrapper><NotFoundPage /></LayoutWrapper>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default App;
