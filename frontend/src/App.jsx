import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useItineraryStore from './store/itineraryStore';
import useBookingStore from './store/bookingStore';
import useBudgetStore from './store/budgetStore';
import { ThemeProvider } from './providers/ThemeProvider';
import Navbar from './components/ui/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Chat from './pages/Chat';
import AICenter from './pages/AICenter'; // Correctly placed import
import Discover from './pages/Discover';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ItineraryBuilder from './components/features/ItineraryBuilder';
import Itinerary from './pages/Itinerary';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Bookings from './pages/Bookings';
import BookingReview from './pages/BookingReview';
import MyBookings from './pages/MyBookings';

// AI Pages
import { TranslationPage } from './pages/ai/TranslationPage';
import { EmergencyPage } from './pages/ai/EmergencyPage';
import { VoicePage } from './pages/ai/VoicePage';
import { ItineraryPage } from './pages/ai/ItineraryPage';
import { BudgetPage } from './pages/ai/BudgetPage';
import { FoodPage } from './pages/ai/FoodPage';
import { WhatIfPage } from './pages/ai/WhatIfPage';
import { ExplainabilityPage } from './pages/ai/ExplainabilityPage';
import { MemoryPage } from './pages/ai/MemoryPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<AICenter />} />
              <Route path="/chat/session" element={<Chat />} />

              {/* NEW AI CONTROL CENTER ROUTES */}
              <Route path="/ai" element={<AICenter />} />
              <Route path="/ai/chat" element={<Chat />} />
              <Route path="/ai/translate" element={<TranslationPage />} />
              <Route path="/ai/emergency" element={<EmergencyPage />} />
              <Route path="/ai/voice" element={<VoicePage />} />
              <Route path="/ai/itinerary" element={<ItineraryPage />} />
              <Route path="/ai/budget" element={<BudgetPage />} />
              <Route path="/ai/food" element={<FoodPage />} />
              <Route path="/ai/what-if" element={<WhatIfPage />} />
              <Route path="/ai/explainability" element={<ExplainabilityPage />} />
              <Route path="/ai/memory" element={<MemoryPage />} />

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

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
