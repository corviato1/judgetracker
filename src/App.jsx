import React from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import NavigationMenu from "./components/NavigationMenu";

import HomePage from "./pages/HomePage";
import JudgeSearchPage from "./pages/JudgeSearchPage";
import JudgeProfilePage from "./pages/JudgeProfilePage";
import DataSourcesPage from "./pages/DataSourcesPage";
import WhichJudgeGamePage from "./pages/WhichJudgeGamePage";
import JudgeDuelPage from "./pages/JudgeDuelPage";
import AdminPage from "./pages/AdminPage";
import AdvertisePage from "./pages/AdvertisePage";

const AppShell = ({ children }) => (
  <div className="app-root">
    <Header />
    <NavigationMenu />
    <main className="app-main">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<JudgeSearchPage />} />
        <Route path="/judge/:judgeId" element={<JudgeProfilePage />} />
        <Route path="/data-sources" element={<DataSourcesPage />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/which-judge" element={<WhichJudgeGamePage />} />
        <Route path="/judge-duel" element={<JudgeDuelPage />} />
        <Route path="/advertise" element={<AdvertisePage />} />

        <Route path="/judges" element={<Navigate to="/search" replace />} />
        <Route path="/duel" element={<Navigate to="/judge-duel" replace />} />
        <Route path="/quiz" element={<Navigate to="/which-judge" replace />} />
        <Route path="/data" element={<Navigate to="/data-sources" replace />} />

        <Route path="*" element={
          <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>Page not found</h2>
            <p style={{ marginBottom: "1.5rem", opacity: 0.7 }}>That URL doesn't exist.</p>
            <Link to="/" style={{ color: "var(--color-accent, #7c83fd)", textDecoration: "underline" }}>
              Back to the homepage
            </Link>
          </div>
        } />
      </Routes>
    </AppShell>
  );
};

export default App;
