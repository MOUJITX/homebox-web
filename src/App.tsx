import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";
import AppShell from "@/components/AppShell";
import SessionExpiredDialog from "@/components/SessionExpiredDialog";
import LoginPage from "@/pages/LoginPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import MembersPage from "@/pages/MembersPage";
import RolesPage from "@/pages/RolesPage";
import ProfilePage from "@/pages/ProfilePage";
import GoodsPage from "@/pages/GoodsPage";
import FilesPage from "@/pages/FilesPage";

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/goods" element={<GoodsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RoleGuard requiredRole="root" />}>
            <Route path="/files" element={<FilesPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/roles" element={<RolesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <Toaster position="top-right" richColors />
    <SessionExpiredDialog />
  </AuthProvider>
);

export default App;
