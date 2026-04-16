import React from "react";
import { Link } from "react-router-dom";
import adHome from "../media/ads/ad-home.png";
import adJudges from "../media/ads/ad-judges.png";
import adScotus from "../media/ads/ad-scotus.png";
import adProfile from "../media/ads/ad-profile.png";
import adWhichJudge from "../media/ads/ad-which-judge.png";
import adDuel from "../media/ads/ad-duel.png";
import adAdvertise from "../media/ads/ad-advertise.png";

const AD_IMAGES = {
  home: adHome,
  judges: adJudges,
  scotus: adScotus,
  profile: adProfile,
  "which-judge": adWhichJudge,
  duel: adDuel,
  advertise: adAdvertise,
};

const AD_ALTS = {
  home: "JudgeTracker.info — Track every ruling, know every judge",
  judges: "Search 3,000+ federal judges on JudgeTracker.info",
  scotus: "Supreme Court Tracker — JudgeTracker.info",
  profile: "Deep-dive judge profiles on JudgeTracker.info",
  "which-judge": "Which Judge Are You? Take the quiz on JudgeTracker.info",
  duel: "Judge Duel — the legal comparison game on JudgeTracker.info",
  advertise: "Advertise on JudgeTracker.info — reach legal professionals",
};

const AdSpots = ({ pageKey = "home", sponsorUrl = null, sponsorImageUrl = null }) => {
  const fallbackImage = AD_IMAGES[pageKey] || adHome;
  const fallbackAlt = AD_ALTS[pageKey] || "JudgeTracker.info";

  if (sponsorUrl && sponsorImageUrl) {
    return (
      <div className="ad-banner-slot">
        <a
          href={sponsorUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-banner-link"
          aria-label="Sponsored advertisement"
        >
          <img
            src={sponsorImageUrl}
            alt="Sponsored"
            className="ad-banner-image"
          />
        </a>
        <span className="ad-banner-label">Sponsored</span>
      </div>
    );
  }

  return (
    <div className="ad-banner-slot">
      <Link
        to="/advertise"
        className="ad-banner-link"
        aria-label="Inquire about advertising on JudgeTracker.info"
      >
        <img
          src={fallbackImage}
          alt={fallbackAlt}
          className="ad-banner-image"
        />
      </Link>
      <span className="ad-banner-label">Your ad here</span>
    </div>
  );
};

export default AdSpots;
