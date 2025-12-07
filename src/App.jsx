import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useItineraryStore from './store/itineraryStore'; // [NEW]
import useBookingStore from './store/bookingStore'; // [NEW]
import useBudgetStore from './store/budgetStore'; // [NEW]
import { ThemeProvider } from './utils/ThemeContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';

import Chat from './pages/Chat';
import Itinerary from './pages/Itinerary';
import ItineraryBuilder from './components/features/ItineraryBuilder';
import Discover from './pages/Discover';
import Budget from './pages/Budget';
import Translate from './pages/Translate';

import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import Settings from './pages/Settings';
import Bookings from './pages/Bookings';
import BookingReview from './pages/BookingReview';
import MyBookings from './pages/MyBookings'; // [NEW]
import ProtectedRoute from './components/layout/ProtectedRoute';

import ScrollToTop from './components/ui/ScrollToTop';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user); // [NEW]
  const fetchTrips = useItineraryStore((state) => state.fetchTrips); // [NEW]
  const fetchBookings = useBookingStore((state) => state.fetchBookings); // [NEW]
  const fetchExpenses = useBudgetStore((state) => state.fetchExpenses); // [NEW]

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // [NEW] Fetch data when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTrips();
      fetchBookings();
      fetchExpenses();
    }
  }, [user, fetchTrips, fetchBookings, fetchExpenses]);

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/itinerary/:id"
                element={
                  <ProtectedRoute>
                    <ItineraryBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/itinerary"
                element={
                  <ProtectedRoute>
                    <Itinerary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget"
                element={
                  <ProtectedRoute>
                    <Budget />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-trips"
                element={
                  <ProtectedRoute>
                    <Itinerary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/review"
                element={
                  <ProtectedRoute>
                    <BookingReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route path="/translate" element={<Translate />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
