import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    role?: string;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the current location to return to later
        return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (role && user.role !== role && user.role !== 'admin') {
        // Redirect to their own dashboard if they hit a wrong role page
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    return <>{children}</>;
}
