import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import BakuNightPage from './pages/BakuNightPage';
import CategoryPage from './pages/CategoryPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import LoginPage from './pages/LoginPage';
import OtpVerifyPage from './pages/OtpVerifyPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Auth səhifələri — Layout-suz */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<OtpVerifyPage />} />

      {/* Layout daxilində */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard/baku-night" element={<BakuNightPage />} />
        <Route path="dashboard/:category" element={<CategoryPage />} />
        <Route path="dashboard/:category/:sub" element={<CategoryPage />} />
        <Route path="developer" element={<CategoryPage />} />

        {/* Qorunan route — yalnız login olanlar */}
        <Route
          path="dataset/:id"
          element={
            <ProtectedRoute>
              <DatasetDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;