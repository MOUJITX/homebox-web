import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/useAuth";

const RoleGuard = ({ requiredRole }: Readonly<{ requiredRole: string }>) => {
  const { role } = useAuth();

  if (role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
