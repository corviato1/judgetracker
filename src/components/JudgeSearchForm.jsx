import React, { useState } from "react";
import { sanitizeSearchQuery } from "../security/inputValidation";
import { searchJudgesByName } from "../API/api";

const JudgeSearchForm = ({ onResults, onQueryChange }) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleChange = (event) => {
    const val = event.target.value;
    setQuery(val);
    if (onQueryChange) onQueryChange(val);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
    </form>
  );
};

export default JudgeSearchForm;
