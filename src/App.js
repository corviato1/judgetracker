import React from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import NavigationMenu from "./components/NavigationMenu";

import HomePage from "./pages/HomePage";
import JudgeSearchPage from "./pages/JudgeSearchPage";
import JudgeProfilePage from "./pages/JudgeProfilePage";
import AboutPage from "./pages/AboutPage";
import DataSourcesPage from "./pages/DataSourcesPage";
import WhichJudgeGamePage from "./pages/WhichJudgeGamePage";
import JudgeDuelPage from "./pages/JudgeDuelPage";

const App = () => {
  return (
    <div className="app-root">
      <Header />
      <NavigationMenu />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<JudgeSearchPage />} />
          <Route path="/judge/:judgeId" element={<JudgeProfilePage />} />
          <Route path="/data-sources" element={<DataSourcesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/which-judge" element={<WhichJudgeGamePage />} />
          <Route path="/judge-duel" element={<JudgeDuelPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
