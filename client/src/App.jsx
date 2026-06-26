import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import ParticipantsPage from './pages/ParticipantsPage';
import ParticipantDetailPage from './pages/ParticipantDetailPage';
import VerifyPage from './pages/VerifyPage';
import AttendancePage from './pages/AttendancePage';
import BulkImportPage from './pages/BulkImportPage';
import BulkMembersPage from './pages/BulkMembersPage';
import BulkPrintPage from './pages/BulkPrintPage';
import SettingsPage from './pages/SettingsPage';
import AuditPage from './pages/AuditPage';
import CardLayoutPage from './pages/CardLayoutPage';
import GuestRegistrationPage from './pages/GuestRegistrationPage';
import HonoraryGuestsPage from './pages/HonoraryGuestsPage';
import AdminRoute from './components/AdminRoute';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/guests" element={<GuestRegistrationPage />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/participants/:id" element={<ParticipantDetailPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/import" element={<AdminRoute><BulkImportPage /></AdminRoute>} />
        <Route path="/bulk-members" element={<AdminRoute><BulkMembersPage /></AdminRoute>} />
        <Route path="/honorary-guests" element={<AdminRoute><HonoraryGuestsPage /></AdminRoute>} />
        <Route path="/bulk-print" element={<BulkPrintPage />} />
        <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        <Route path="/card-layout" element={<CardLayoutPage />} />
        <Route path="/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default App;
