import React from "react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>JudgeTracker.info</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", opacity: 0.9 }}>
            Transparent insight into judicial records, rulings, and case
            histories.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
