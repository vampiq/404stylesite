import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/card';
import { useAuth } from '@/store/auth';
import type { Role } from '@/lib/types';

/** Защита маршрутов: гость → /login (с возвратом), чужая роль → на главную. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <div className="container space-y-4 py-24" aria-busy><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64" /></div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'CLIENT' ? '/dashboard' : '/admin'} replace />;
  return <Outlet />;
}
