const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

async function apiFetch(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API error ${response.status}`);
  }

  return response.json();
}

export async function searchJudges(query) {
  const data = await apiFetch(`/api/judges/search?q=${encodeURIComponent(query)}`);
  return data.results || [];
}

export async function fetchJudgeById(id) {
  const data = await apiFetch(`/api/judges/${id}`);
  return data.judge;
}

export async function fetchJudgeOpinions(judgeId) {
  const data = await apiFetch(`/api/judges/${judgeId}/opinions`);
  return data.opinions || [];
}

export async function fetchJudgeStats(judgeId) {
  const data = await apiFetch(`/api/judges/${judgeId}/stats`);
  return data;
}

export async function fetchDuelPair(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "any") params.set(k, v);
  });
  const qs = params.toString();
  const data = await apiFetch(`/api/duel/pair${qs ? `?${qs}` : ""}`);
  return data;
}

const courtListenerApi = { searchJudges, fetchJudgeById, fetchJudgeOpinions, fetchJudgeStats, fetchDuelPair };
export default courtListenerApi;
