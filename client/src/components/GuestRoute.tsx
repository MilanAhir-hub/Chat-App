import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from './Loader';

export const GuestRoute = () => {
  const { user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <Loader fullScreen size="lg" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
