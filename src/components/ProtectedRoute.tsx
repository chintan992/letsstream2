import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";
import RouteLoading from "@/components/ui/route-loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoading label="Checking your session" />;
  }

  if (!user) {
    // Remember where the user was heading so signing in can return them there
    // instead of dropping them on the homepage.
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
