import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "jt_session_id";

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function track(eventType, payload = {}) {
  const sessionId = getSessionId();
  const body = JSON.stringify({
    eventType,
    sessionId,
    judgeId: payload.judgeId || null,
    query: payload.query || null,
    route: payload.route || window.location.pathname,
    metadata: payload.metadata || {},
  });

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(route, metadata = {}) {
  track("page_view", { route, metadata: { ...metadata, referrer: document.referrer } });
}

export function trackSearch(query, resultCount) {
  track("search", { query, metadata: { resultCount } });
  if (resultCount === 0) {
    track("search_no_results", { query });
  }
}

export function trackDuelStart(filters = {}) {
  track("duel_start", { metadata: { filters } });
}

export function trackDuelRound(roundNumber, statKey, judge1Id, judge2Id, selectedJudgeId, correct) {
  track("duel_round", { metadata: { roundNumber, statKey, judge1Id, judge2Id, selectedJudgeId, correct } });
}

export function trackDuelComplete(score, rounds) {
  track("duel_complete", { metadata: { score, rounds } });
}

export function trackQuizStart() {
  track("quiz_start");
}

export function trackQuizAnswer(questionId, answerId, questionIndex) {
  track("quiz_answer", { metadata: { questionId, answerId, questionIndex } });
}

export function trackQuizComplete(resultLabel, topMatchJudgeId, score) {
  track("quiz_complete", { metadata: { resultLabel, topMatchJudgeId, score } });
}

export function trackAdImpression(placementSlug) {
  track("ad_impression", { metadata: { placementSlug } });
}

export function trackPageExit(route, durationMs) {
  track("page_exit", { route, metadata: { duration_ms: durationMs } });
}
