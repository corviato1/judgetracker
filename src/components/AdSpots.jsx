import React, { useState, useEffect } from "react";
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

let placementsCache = null;
let placementsFetchPromise = null;

function fetchPlacements() {
  if (placementsCache !== null) return Promise.resolve(placementsCache);
  if (placementsFetchPromise) return placementsFetchPromise;
  placementsFetchPromise = fetch("/api/admin/ads/placements")
    .then((r) => (r.ok ? r.json() : { placements: {} }))
    .then((data) => {
      placementsCache = data.placements || {};
      placementsFetchPromise = null;
      return placementsCache;
    })
    .catch(() => {
      placementsFetchPromise = null;
      placementsCache = {};
      return {};
    });
  return placementsFetchPromise;
}

const AdSpots = ({ pageKey = "home", sponsorUrl = null, sponsorImageUrl = null }) => {
  const fallbackImage = AD_IMAGES[pageKey] || adHome;
  const fallbackAlt = AD_ALTS[pageKey] || "JudgeTracker.info";

  const [sponsorData, setSponsorData] = useState(null);
  const [impressionSent, setImpressionSent] = useState(false);

  useEffect(() => {
    if (sponsorUrl && sponsorImageUrl) return;
    fetchPlacements().then((placements) => {
      const placement = placements[pageKey] || null;
      setSponsorData(placement);
    });
  }, [pageKey, sponsorUrl, sponsorImageUrl]);

  const resolvedSponsorUrl = sponsorUrl || (sponsorData && sponsorData.sponsor_url) || null;
  const resolvedSponsorImageUrl = sponsorImageUrl || (sponsorData && sponsorData.sponsor_image_url) || null;

  useEffect(() => {
    if (resolvedSponsorUrl && resolvedSponsorImageUrl && !impressionSent) {
      setImpressionSent(true);
      fetch("/api/admin/ads/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey }),
      }).catch(() => {});
    }
  }, [resolvedSponsorUrl, resolvedSponsorImageUrl, impressionSent, pageKey]);

  if (resolvedSponsorUrl && resolvedSponsorImageUrl) {
    return (
      <div className="ad-banner-slot">
        <a
          href={resolvedSponsorUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ad-banner-link"
          aria-label="Sponsored advertisement"
        >
          <img
            src={resolvedSponsorImageUrl}
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
