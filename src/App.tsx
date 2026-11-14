import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { TripWizard } from './pages/TripWizard';
import { ItineraryDashboard } from './pages/ItineraryDashboard';
import { DragDropPlanner } from './pages/DragDropPlanner';
import { AlternativesPage } from './pages/AlternativesPage';
import { ExpenseTracker } from './pages/ExpenseTracker';
import { MyTripsPage } from './pages/MyTripsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <TripProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/create-trip" element={<TripWizard />} />
          <Route path="/dashboard" element={<ItineraryDashboard />} />
          <Route path="/planner" element={<DragDropPlanner />} />
          <Route path="/alternatives" element={<AlternativesPage />} />
          <Route path="/expenses" element={<ExpenseTracker />} />
          <Route path="/trips" element={<MyTripsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TripProvider>
  );
}
