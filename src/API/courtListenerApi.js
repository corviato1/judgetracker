// This file describes how the production API layer will look.
// For the demo, the application uses mockApi.js instead.

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "https://api.example.com";

export const fetchJudges = async (query) => {
  const url = new URL("/judges/search", API_BASE_URL);
  url.searchParams.set("name", query);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch judges: ${response.status}`);
  }

  return response.json();
};

export const fetchJudgeOpinions = async (judgeId) => {
  const url = new URL(`/judges/${judgeId}/opinions`, API_BASE_URL);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opinions: ${response.status}`);
  }

  return response.json();
};
