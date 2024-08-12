import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Common/PrivateRoute';
import AdminRoute from './components/Common/AdminRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProtestaListPage from './pages/ProtestaListPage';
import ProtestaFormPage from './pages/ProtestaFormPage';
import ProtestaDetailPage from './pages/ProtestaDetailPage';
import CabecillaListPage from './pages/CabecillaListPage';
import CabecillaFormPage from './pages/CabecillaFormPage';
import NaturalezaListPage from './pages/NaturalezaListPage';
import NaturalezaFormPage from './pages/NaturalezaFormPage';
import UserListPage from './pages/UserListPage';
import CabecillaList from './components/Cabecilla/CabecillaList';
import CabecillaForm from './components/Cabecilla/CabecillaForm';
import NaturalezaList from './components/Naturaleza/NaturalezaList';
import NaturalezaForm from './components/Naturaleza/NaturalezaForm';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserProfilePage from './pages/UserProfilePage'; 

import RegisterPage from './pages/RegisterPage';

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
      </Layout>
    </AuthProvider>
  );
};

export default App;
