import React, { useState } from "react";
import { sanitizeSearchQuery } from "../security/inputValidation";
import { searchJudgesByName } from "../API/api";

const JudgeSearchForm = ({ onResults, onQueryChange }) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleChange = (event) => {
    const val = event.target.value;
    setQuery(val);
    if (onQueryChange) onQueryChange(val);
    if (searchError) setSearchError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSearchError(null);

    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) {
      onResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const judges = await searchJudgesByName(sanitized);
      onResults(judges);
    } catch (error) {
      console.error("Judge search failed:", error);
      onResults([]);
      setSearchError(error.message || "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        className="search-input"
        type="text"
        placeholder="Search by judge name, for example: Jane Doe"
        value={query}
        onChange={handleChange}
      />
      <button className="search-button" type="submit" disabled={isSearching}>
        {isSearching ? "Searching..." : "Search"}
      </button>
      {searchError && (
        <p className="search-error" role="alert" style={{ color: "#fc8181", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          {searchError}
        </p>
      )}
    </form>
  );
};

export default JudgeSearchForm;
