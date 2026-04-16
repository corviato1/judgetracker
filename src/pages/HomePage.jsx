import React from "react";
import HeroSection from "../components/HeroSection";
import FeatureHighlights from "../components/FeatureHighlights";
import AdSpots from "../components/AdSpots";
import DataCoverageSection from "../components/DataCoverageSection";

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <FeatureHighlights />
      <AdSpots pageKey="home" />
      <DataCoverageSection />
    </div>
  );
};

export default HomePage;
