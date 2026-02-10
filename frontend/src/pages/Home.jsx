import useAuthStore from '../store/authStore';
import LandingPage from '../components/home/LandingPage';
import UserDashboard from '../components/home/UserDashboard';

const Home = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <UserDashboard /> : <LandingPage />;
};

export default Home;
