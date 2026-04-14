import React from "react";
import { Link } from "react-router-dom";
import templateAdBanner from "../media/ads/template-ad-banner.png";

const AdSpots = () => {
  const adSlots = [
    {
      id: "ad1",
      label: "Premium banner",
      title: "Top-of-page sponsor",
      description:
        "High visibility placement for law firms, research tools, or legal technology platforms that want to reach litigators and policy teams.",
      size: "Full width · desktop and mobile",
      url: null,
    },
    {
      id: "ad2",
      label: "Contextual placement",
      title: "Judge or topic-specific ads",
      description:
        "Context-aware placements that show when users view certain courts, jurisdictions, or issue areas, with strict separation from search results.",
      size: "In-feed placement · judge profile pages",
      url: null,
    },
    {
      id: "ad3",
      label: "Data tools integrations",
      title: "Featured analytics partners",
      description:
        "Slots for co-branded analytics, visualization tools, or law firm knowledge platforms that integrate directly into JudgeTracker workflows.",
      size: "Module slot · analytics sidebar",
      url: null,
    },
  ];

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3 className="section-heading">Advertising &amp; partnerships</h3>
      <p className="section-subheading">
        JudgeTracker supports a transparent sponsor model that keeps search
        results clean. Placements are available for legal technology vendors,
        law firms, and data providers.
      </p>

      <div className="ad-grid">
        {adSlots.map((slot) => (
          <article key={slot.id} className="ad-card">
            <div className="small-label">{slot.label}</div>
            <h4 className="card-title">{slot.title}</h4>
            <p className="card-description">{slot.description}</p>
            <p className="ad-meta">{slot.size}</p>
            {slot.id === "ad1" ? (
              <div className="ad-placeholder ad-placeholder--image">
                {slot.url ? (
                  <a
                    href={slot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ad-image-link"
                    aria-label="Visit advertiser"
                  >
                    <img
                      src={templateAdBanner}
                      alt="Sponsored — JudgeTracker.info"
                      className="ad-template-image"
                    />
                  </a>
                ) : (
                  <Link
                    to="/advertise"
                    className="ad-image-link"
                    aria-label="Inquire about this ad placement"
                  >
                    <img
                      src={templateAdBanner}
                      alt="Your Ad Here — click to inquire about this placement"
                      className="ad-template-image"
                    />
                  </Link>
                )}
              </div>
            ) : (
              <div className="ad-placeholder">
                Ad preview
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdSpots;
