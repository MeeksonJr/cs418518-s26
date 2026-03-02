
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading, isAdmin, profile, aal } = useAuth();

    if (loading) return <div className="loading">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If 2FA is enabled in profile but session is still aal1, redirect to login
    // This handles cases where session persists but MFA status changed or was missed
    if (profile?.is_2fa_enabled && aal === 'aal1') {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
