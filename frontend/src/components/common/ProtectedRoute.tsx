import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
}

export default function ProtectedRoute({ children, roles, permissions }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-app-gradient)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFE264, #F2A900)' }}>
            <Loader2 size={24} className="text-[#001133] animate-spin" />
          </div>
          <p className="text-sm text-white/40">Loading PeopleFlow...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permissions && !permissions.some((perm) => hasPermission(perm))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}