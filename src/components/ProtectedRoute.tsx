
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  allowedRoles?: Array<Profile['role']>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading: authLoading, session } = useAuth();
  const location = useLocation();

  const fetchProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile for route protection', error);
      return null;
    }
    return data;
  };

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ['userProfileRole', user?.id],
    queryFn: fetchProfile,
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = authLoading || (!!user && profileLoading);

  if (isLoading) {
    return (
      <div className="container flex-grow flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (isError) {
    // Redirect to home if we can't fetch the profile
    return <Navigate to="/" replace />;
  }

  // If there are allowed roles, check if user's role is one of them
  if (allowedRoles && profile && allowedRoles.includes(profile.role)) {
    return <Outlet />;
  }

  // If roles are required but user doesn't have one, redirect
  if (allowedRoles) {
    return <Navigate to="/" replace />;
  }

  // If no roles are specified, just being logged in is enough
  return <Outlet />;
};

export default ProtectedRoute;
