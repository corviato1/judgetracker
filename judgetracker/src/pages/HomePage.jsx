// src/pages/HomePage.jsx
import React from "react";
import HeroSection from "../components/HeroSection";
import FeatureHighlights from "../components/FeatureHighlights";
import AdSpots from "../components/AdSpots";

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <FeatureHighlights />
      <AdSpots />
    </div>
  );
};

export default HomePage;
