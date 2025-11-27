// src/components/AdSpots.jsx
import React from "react";

const AdSpots = () => {
  const adSlots = [
    {
      id: "ad1",
      label: "Premium banner",
      title: "Top-of-page sponsor",
      description:
        "High visibility placement for law firms, research tools, or legal technology platforms that want to reach litigators and policy teams.",
      size: "Full width · desktop and mobile",
    },
    {
      id: "ad2",
      label: "Contextual placement",
      title: "Judge or topic-specific ads",
      description:
        "Context-aware placements that show when users view certain courts, jurisdictions, or issue areas, with strict separation from search results.",
      size: "In-feed placement · judge profile pages",
    },
    {
      id: "ad3",
      label: "Data tools integrations",
      title: "Featured analytics partners",
      description:
        "Slots for co-branded analytics, visualization tools, or law firm knowledge platforms that integrate directly into JudgeTracker workflows.",
      size: "Module slot · analytics sidebar",
    },
  ];

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3 className="section-heading">Monetization and sponsor placement</h3>
      <p className="section-subheading">
        JudgeTracker can support a clear, transparent sponsor model without
        interfering with the integrity of search results. These sample ad
        locations illustrate where legal technology vendors, law firms, and
        data providers could appear.
      </p>

      <div className="ad-grid">
        {adSlots.map((slot) => (
          <article key={slot.id} className="ad-card">
            <div className="small-label">{slot.label}</div>
            <h4 className="card-title">{slot.title}</h4>
            <p className="card-description">{slot.description}</p>
            <p className="ad-meta">{slot.size}</p>
            <div className="ad-placeholder">
              Ad preview
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdSpots;
