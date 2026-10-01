import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Route Guards
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { PublicRoute } from './components/guards/PublicRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
const PolicyPage = lazy(() => import('./pages/PolicyPage'));

// Protected Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ResumePage from './pages/dashboard/ResumePage';
const AnalysisPage = lazy(() => import('./pages/dashboard/AnalysisPage'));
const ATSPage = lazy(() => import('./pages/dashboard/ATSPage'));
const ResumeOptimizerPage = lazy(() => import('./pages/dashboard/ResumeOptimizerPage'));
const HelpPage = lazy(() => import('./pages/dashboard/HelpPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const JobTrackerPage = lazy(() => import('./pages/dashboard/JobTrackerPage'));
const CareerAnalyticsPage = lazy(() => import('./pages/dashboard/CareerAnalyticsPage'));
const InterviewPrepPage = lazy(() => import('./pages/dashboard/InterviewPrepPage'));

// Error Pages
import NotFoundPage from './pages/errors/NotFoundPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';

export const App: React.FC = () => {
  return (
    <Suspense fallback={<div role="status" className="p-8 text-center">Loading your workspace…</div>}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
      <Route path="/terms" element={<PolicyPage kind="terms" />} />
      <Route path="/support" element={<PolicyPage kind="support" />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="ats" element={<ATSPage />} />
        <Route path="optimizer" element={<ResumeOptimizerPage />} />
        <Route path="jobs" element={<JobTrackerPage />} />
        <Route path="interview" element={<InterviewPrepPage />} />
        <Route path="analytics" element={<CareerAnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>

      {/* Error routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
    </Suspense>
  );
};

export default App;
