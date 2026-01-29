
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BackgroundProvider, useBackground } from './contexts/BackgroundContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ArtistPublicPage from './pages/ArtistPublicPage';
import PublicFeedbackPage from './pages/PublicFeedbackPage';
import { AnimatePresence } from 'framer-motion';

// Separate component to consume Context
const AppContent = () => {
  const { background } = useBackground();

  return (
    <div className="fixed inset-0 min-h-screen bg-black overflow-hidden flex justify-center selection:bg-indigo-500/30">
      {/* 1. Global Outer Background (Blurred) */}
      <div className="absolute inset-0 z-0">
        {/* Default Background */}
        <div className="absolute inset-0 bg-slate-950" />

        {/* Dynamic Image Background */}
        {background && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out blur-3xl opacity-50 scale-110"
            style={{ backgroundImage: `url(${background})` }}
          />
        )}

        {/* Overlay for readability consistency */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 2. Mobile Container (The "Phone Screen") */}
      <div className="relative z-10 w-full max-w-[480px] h-full bg-slate-950 shadow-2xl overflow-hidden flex flex-col border-x border-slate-800/50">
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <AppRoutes />
        </div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        {/* Public Profile Route */}
        <Route path="/u/:handle" element={<ArtistPublicPage />} />

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Other Public Routes */}
        <Route path="/track/:trackId" element={<PublicFeedbackPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {
  return (
    <Router>
      <AuthProvider>
        <BackgroundProvider>
          <AppContent />
        </BackgroundProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
