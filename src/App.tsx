import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Common/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtestaListPage from './pages/ProtestaListPage';
import ProtestaFormPage from './pages/ProtestaFormPage';
import ProtestaDetailPage from './pages/ProtestaDetailPage';
import CabecillaListPage from './pages/CabecillaListPage';
import CabecillaFormPage from './pages/CabecillaFormPage';
import NaturalezaListPage from './pages/NaturalezaListPage';
import NaturalezaFormPage from './pages/NaturalezaFormPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/protestas" element={<PrivateRoute><ProtestaListPage /></PrivateRoute>} />
          <Route path="/protestas/new" element={<PrivateRoute><ProtestaFormPage /></PrivateRoute>} />
          <Route path="/protestas/:id" element={<PrivateRoute><ProtestaDetailPage /></PrivateRoute>} />
          <Route path="/protestas/editar/:id" element={<PrivateRoute><ProtestaFormPage /></PrivateRoute>} />
          <Route path="/cabecillas" element={<PrivateRoute><CabecillaListPage /></PrivateRoute>} />
          <Route path="/cabecillas/new" element={<PrivateRoute><CabecillaFormPage /></PrivateRoute>} />
          <Route path="/cabecillas/:id" element={<PrivateRoute><CabecillaFormPage /></PrivateRoute>} />
          <Route path="/naturalezas" element={<PrivateRoute><NaturalezaListPage /></PrivateRoute>} />
          <Route path="/naturalezas/new" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
          <Route path="/naturalezas/:id" element={<PrivateRoute><NaturalezaFormPage /></PrivateRoute>} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
};

export default App;
