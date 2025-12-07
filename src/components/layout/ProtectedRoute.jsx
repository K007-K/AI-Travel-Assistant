import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
