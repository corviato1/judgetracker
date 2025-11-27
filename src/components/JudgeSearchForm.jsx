import React, { useState } from "react";
import { sanitizeSearchQuery } from "../security/inputValidation";
import { searchJudgesByName } from "../API/mockApi";

const JudgeSearchForm = ({ onResults }) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="search-button" type="submit" disabled={isSearching}>
        {isSearching ? "Searching..." : "Search"}
      </button>
    </form>
  );
};

export default JudgeSearchForm;
