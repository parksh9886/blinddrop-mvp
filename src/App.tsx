
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TracksPage from './pages/TracksPage';
import ProfilePage from './pages/ProfilePage';
import ArtistPublicPage from './pages/ArtistPublicPage';
// import PublicFeedbackPage from './pages/PublicFeedbackPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Profile Route */}
            <Route path="/u/:handle" element={<ArtistPublicPage />} />
            <Route path="/@:handle" element={<ArtistPublicPage />} />

            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tracks" element={<TracksPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Other Public Routes */}
            {/* <Route path="/track/:trackId" element={<PublicFeedbackPage />} /> REMOVED */}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
