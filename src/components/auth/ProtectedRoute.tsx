import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { firebaseUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-xl mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
