import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ProjectNotesPage from '@/pages/ProjectNotesPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PROJECT_NOTES_PATH = '/projects/notes';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (location.pathname === PROJECT_NOTES_PATH) {
    return <ProjectNotesPage />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-construction-primary" />
      </div>
    );
  }

  if (!user) {
    const destination = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(destination)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
