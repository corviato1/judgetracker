const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

async function apiFetch(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.error || `API error ${response.status}`);
    err.status = response.status;
    err.responseBody = body;
    throw err;
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

export async function fetchAllJudges() {
  const data = await apiFetch(`/api/judges`);
  return data.judges || [];
}

export async function fetchJudgeHistory(judgeId) {
  const data = await apiFetch(`/api/judges/${judgeId}/history`);
  return {
    reversals: data.reversals || [],
    violentFelonyReleases: data.violentFelonyReleases || [],
    citations: data.citations || [],
  };
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
