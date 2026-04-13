import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, token, loading }) {
  if (loading) return <div className="p-4 text-center">Carregando...</div>;
  if (!token) return <Navigate to="/" replace />;
  return children;
}
