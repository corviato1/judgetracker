import React from "react";
import { NavLink } from "react-router-dom";

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

const NavigationMenu = () => {
  const navClassName = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <nav className="nav-menu">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id} className="nav-section">
          <span className="nav-section-label">{section.label}</span>
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
      ))}
    </nav>
  );
};

export default NavigationMenu;
