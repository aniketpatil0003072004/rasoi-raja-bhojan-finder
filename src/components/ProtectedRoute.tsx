import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface ProtectedRouteProps {
  allowedRoles?: Array<Profile["role"]>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const [authLoading, setAuthLoading] = useState(false);
  const userName = sessionStorage.getItem("username");

  const location = useLocation();

  const fetchProfile = async () => {
    setAuthLoading(true);
    if (!userName) return null;
    const { data, error } = await supabase
      .from("user")
      .select("role")
      .eq("user_name", userName)
      .single();

    if (error) {
      console.error("Error fetching profile for route protection", error);
      return null;
    }
    setAuthLoading(false);
    return data;
  };

  const {
    data: profile,
    isLoading: profileLoading,
    isError,
  } = useQuery({
    queryKey: ["userProfileRole", userName],
    queryFn: fetchProfile,
    enabled: !!userName,
  });

  const isLoading = authLoading || (!!userName && profileLoading);

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

  if (!userName) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  console.log(profile);

  if (isError || !profile) {
    // Redirect to home if we can't fetch the profile
    return <Navigate to="/" replace />;
  }

  // If there are allowed roles, check if user's role is one of them
  if (allowedRoles) {
    if (allowedRoles.includes(profile.role)) {
      return <Outlet />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // If roles are required but user doesn't have one, redirect
  if (allowedRoles) {
    return <Navigate to="/" replace />;
  }

  // If no roles are specified, just being logged in is enough
  return <Outlet />;
};

export default ProtectedRoute;
