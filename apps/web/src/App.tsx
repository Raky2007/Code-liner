import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';

import DashboardPage from './pages/DashboardPage';
import ProjectDetailLayout from './layouts/ProjectDetailLayout';
import OverviewPage from './pages/OverviewPage';
import ExplorerPage from './pages/ExplorerPage';
import ArchitecturePage from './pages/ArchitecturePage';
import DependenciesPage from './pages/DependenciesPage';
import IssuesPage from './pages/IssuesPage';
import DocumentationPage from './pages/DocumentationPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="files" element={<ExplorerPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
        <Route path="dependencies" element={<DependenciesPage />} />
        <Route path="issues" element={<IssuesPage />} />
        <Route path="documentation" element={<DocumentationPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
