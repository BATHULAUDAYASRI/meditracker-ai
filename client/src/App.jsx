import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import PharmaciesPage from "./pages/PharmaciesPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import RemindersPage from "./pages/RemindersPage";
import ProfilePage from "./pages/ProfilePage";
import DoctorPage from "./pages/DoctorPage";

function ProtectedApp() {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/chat" element={<Navigate to="/" replace />} />
        <Route
          path="/pharmacies"
          element={user.role === "patient" ? <PharmaciesPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/prescriptions"
          element={user.role === "patient" ? <PrescriptionsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reminders"
          element={user.role === "patient" ? <RemindersPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={user.role === "patient" ? <ProfilePage /> : <Navigate to="/" replace />}
        />
        <Route path="/patient" element={<Navigate to="/prescriptions" replace />} />
        <Route
          path="/doctor"
          element={user.role === "doctor" ? <DoctorPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
