import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Role = 'admin' | 'user';

type ProtectedRouteProps = {
  children: ReactNode;
  allowRoles?: Role[];
};

export function ProtectedRoute({ children, allowRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Checking permissions...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl border bg-white px-8 py-6 shadow-sm text-center">
          <h1 className="text-lg font-semibold mb-2">Access denied</h1>
          <p className="text-sm text-slate-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


