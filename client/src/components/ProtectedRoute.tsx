import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const ProtectedRoute = () => {
  const { user, isCheckingAuth } = useAuth();
  const location = useLocation();

  if (isCheckingAuth) {
    return <Loader fullScreen size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
