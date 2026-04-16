import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_SECTIONS = [
  {
    id: "about",
    label: "About",
    links: [
      { to: "/", label: "Home", end: true },
      { to: "/advertise", label: "Advertise" },
    ],
  },
  {
    id: "raw-data",
    label: "Raw Data",
    links: [
      { to: "/judges", label: "Judge Search" },
      { to: "/judges/scotus", label: "SCOTUS" },
      { to: "/judge-history", label: "Judge Profile" },
    ],
  },
  {
    id: "games",
    label: "Games",
    links: [
      { to: "/which-judge", label: "Which Judge Are You?" },
      { to: "/judge-duel", label: "Judge Duel" },
    ],
  },
];

function findSectionForPath(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const link of section.links) {
      if (link.end ? pathname === link.to : pathname.startsWith(link.to)) {
        return section.id;
      }
    }
  }
  return null;
}

const NavigationMenu = () => {
  const location = useLocation();
  const [openId, setOpenId] = useState(() => findSectionForPath(location.pathname));

  useEffect(() => {
    const matched = findSectionForPath(location.pathname);
    if (matched) setOpenId(matched);
  }, [location.pathname]);

  const navClassName = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  const toggle = (id) => setOpenId((current) => (current === id ? null : id));

  return (
    <nav className="nav-menu">
      {NAV_SECTIONS.map((section) => {
        const isOpen = openId === section.id;
        return (
          <div
            key={section.id}
            className={`nav-section${isOpen ? " nav-section-open" : ""}`}
          >
            <button
              type="button"
              className="nav-section-toggle"
              aria-expanded={isOpen}
              aria-controls={`nav-section-${section.id}`}
              onClick={() => toggle(section.id)}
            >
              <span className="nav-section-label">{section.label}</span>
              <span className={`nav-section-chevron${isOpen ? " nav-section-chevron-open" : ""}`} aria-hidden="true">
                ▸
              </span>
            </button>
            {isOpen && (
              <div id={`nav-section-${section.id}`} className="nav-section-links">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={navClassName}
                    end={link.end}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
