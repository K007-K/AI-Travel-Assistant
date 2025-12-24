import useAuthStore from '../store/authStore';
import LandingPage from '../components/home/LandingPage';
import UserDashboard from '../components/home/UserDashboard';

const Home = () => {
    const { isAuthenticated } = useAuthStore();

    return isAuthenticated ? <UserDashboard /> : <LandingPage />;
};

export default Home;
