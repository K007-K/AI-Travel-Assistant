import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Bookings from './pages/Bookings'; // [NEW]
import ProtectedRoute from './components/layout/ProtectedRoute';

import ScrollToTop from './components/ui/ScrollToTop';

function App() {
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
