import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import useAuthStore from './store/authStore';
import { ThemeProvider } from './providers/ThemeProvider';
import Navbar from './components/ui/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// ─── Lazy-loaded pages (code-split per route) ───
const Home = lazy(() => import('./pages/Home'));
const Chat = lazy(() => import('./pages/Chat'));
const AIControlCenter = lazy(() => import('./pages/AIControlCenter'));
import AICompanion from './components/companion/AICompanion';
const Discover = lazy(() => import('./pages/Discover'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ItineraryBuilder = lazy(() => import('./components/features/ItineraryBuilder'));
const Itinerary = lazy(() => import('./pages/Itinerary'));
const Budget = lazy(() => import('./pages/Budget'));
const Settings = lazy(() => import('./pages/Settings'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingReview = lazy(() => import('./pages/BookingReview'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'));

// AI Pages (named exports → wrapped for React.lazy)
const TranslationPage = lazy(() => import('./pages/ai/TranslationPage').then(m => ({ default: m.TranslationPage })));
const EmergencyPage = lazy(() => import('./pages/ai/EmergencyPage').then(m => ({ default: m.EmergencyPage })));
const VoicePage = lazy(() => import('./pages/ai/VoicePage').then(m => ({ default: m.VoicePage })));
const ItineraryPage = lazy(() => import('./pages/ai/ItineraryPage').then(m => ({ default: m.ItineraryPage })));
const BudgetPage = lazy(() => import('./pages/ai/BudgetPage').then(m => ({ default: m.BudgetPage })));
const FoodPage = lazy(() => import('./pages/ai/FoodPage').then(m => ({ default: m.FoodPage })));
const WhatIfPage = lazy(() => import('./pages/ai/WhatIfPage').then(m => ({ default: m.WhatIfPage })));
const ExplainabilityPage = lazy(() => import('./pages/ai/ExplainabilityPage').then(m => ({ default: m.ExplainabilityPage })));
const MemoryPage = lazy(() => import('./pages/ai/MemoryPage').then(m => ({ default: m.MemoryPage })));

// ─── Lightweight page loader (shown during chunk loading) ───
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<AIControlCenter />} />
                  <Route path="/chat/session" element={<Chat />} />

                  {/* AI CONTROL CENTER ROUTES */}
                  <Route path="/ai" element={<AIControlCenter />} />
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
                  <Route path="/destination/:id" element={<DestinationDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
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
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
          <AICompanion />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
