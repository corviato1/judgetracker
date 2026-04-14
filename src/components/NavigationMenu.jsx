import React from "react";
import { NavLink } from "react-router-dom";

const NavigationMenu = () => {
  const navClassName = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <nav className="nav-menu">
      <NavLink to="/" className={navClassName} end>
        Overview
      </NavLink>
      <NavLink to="/search" className={navClassName}>
        Judge Search
      </NavLink>
      <NavLink to="/judge-history" className={navClassName}>
        Judge History
      </NavLink>
      <NavLink to="/which-judge" className={navClassName}>
        Which Judge Are You?
      </NavLink>
      <NavLink to="/judge-duel" className={navClassName}>
        Judge Duel
      </NavLink>
    </nav>
  );
};

export default NavigationMenu;
