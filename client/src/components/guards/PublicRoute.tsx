import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';
import { AUTH_LAUNCH_MS, canAnimateAuthLaunch } from '../auth/authLaunch';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Redirects already-authenticated users to /dashboard.
 * Prevents authenticated users from accessing login/register pages.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasShownPublicPage = useRef(false);
  const [exitFinished, setExitFinished] = useState(false);

  if (!isLoading && !isAuthenticated) hasShownPublicPage.current = true;

  useEffect(() => {
    if (!isAuthenticated || !hasShownPublicPage.current || !canAnimateAuthLaunch()) return undefined;
    const timer = window.setTimeout(() => setExitFinished(true), AUTH_LAUNCH_MS + 150);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  if (isLoading) {
    return <Loader variant="page" />;
  }

  if (isAuthenticated && (!hasShownPublicPage.current || !canAnimateAuthLaunch() || exitFinished)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
