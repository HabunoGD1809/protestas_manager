import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Common/PrivateRoute';
import AdminRoute from './components/Common/AdminRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';

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
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CabecillaList = lazy(() => import('./components/Cabecilla/CabecillaList'));
const CabecillaForm = lazy(() => import('./components/Cabecilla/CabecillaForm'));
const NaturalezaList = lazy(() => import('./components/Naturaleza/NaturalezaList'));
const NaturalezaForm = lazy(() => import('./components/Naturaleza/NaturalezaForm'));

const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = (event: CustomEvent<string>) => {
      console.error('Auth error:', event.detail);
      navigate('/login');
    };

    window.addEventListener('auth-error', handleAuthError as EventListener);

    return () => {
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, [navigate]);

  return (
    <AuthProvider>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/perfil" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} /> 
          <Route path="/protestas" element={<PrivateRoute><ProtestaListPage /></PrivateRoute>} />
          <Route path="/protestas/crear" element={<PrivateRoute><ProtestaFormPage /></PrivateRoute>} />
          <Route path="/protestas/editar/:id" element={<PrivateRoute><ProtestaFormPage /></PrivateRoute>} />
          <Route path="/protestas/:id" element={<PrivateRoute><ProtestaDetailPage /></PrivateRoute>} />
          <Route path="/cabecillas" element={<PrivateRoute><CabecillaListPage /></PrivateRoute>} />
          <Route path="/cabecillas/new" element={<PrivateRoute><CabecillaFormPage /></PrivateRoute>} />
          <Route path="/cabecillas/:id" element={<PrivateRoute><CabecillaFormPage /></PrivateRoute>} />
          <Route path="/naturalezas" element={<PrivateRoute><NaturalezaListPage /></PrivateRoute>} />
          <Route path="/naturalezas/new" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
          <Route path="/naturalezas/:id" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
          <Route path="/usuarios" element={<AdminRoute><UserListPage /></AdminRoute>} />
          <Route path="/cabecillas" element={<PrivateRoute><CabecillaList /></PrivateRoute>} />
          <Route path="/cabecillas/new" element={<PrivateRoute><CabecillaForm /></PrivateRoute>} />
          <Route path="/cabecillas/edit/:id" element={<PrivateRoute><CabecillaForm /></PrivateRoute>} />
          <Route path="/naturalezas" element={<PrivateRoute><NaturalezaList /></PrivateRoute>} />
          <Route path="/naturalezas/new" element={<PrivateRoute><NaturalezaForm /></PrivateRoute>} />
          <Route path="/naturalezas/edit/:id" element={<PrivateRoute><NaturalezaForm /></PrivateRoute>} />
          <Route path="/naturalezas/new" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
          <Route path="/naturalezas/edit/:id" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
          
          {/* Nueva ruta para el dashboard de administrador */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Suspense>
      </Layout>
    </AuthProvider>
  );
};

export default App;
