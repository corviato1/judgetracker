import React, { useState, useCallback } from "react";
import { fetchDuelPair } from "../API/courtListenerApi";

const TOTAL_ROUNDS = 5;

const FILTER_DEFAULTS = {
  state: "any",
  courtLevel: "any",
  gender: "any",
  party: "any",
  status: "active",
};

const STATE_OPTIONS = [
  { value: "any", label: "Any state" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "FL", label: "Florida" },
  { value: "IL", label: "Illinois" },
];

const COURT_LEVEL_OPTIONS = [
  { value: "any", label: "Any court level" },
  { value: "federal_district", label: "Federal District" },
  { value: "federal_appeals", label: "Federal Appeals" },
  { value: "state_supreme", label: "State Supreme" },
  { value: "state_appeals", label: "State Appeals" },
  { value: "family", label: "Family Court" },
];

const GENDER_OPTIONS = [
  { value: "any", label: "Any gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const PARTY_OPTIONS = [
  { value: "any", label: "Any appointing party" },
  { value: "Democrat", label: "Democrat" },
  { value: "Republican", label: "Republican" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active only" },
  { value: "any", label: "Active and retired" },
];

function FilterScreen({ onStart }) {
  const [filters, setFilters] = useState(FILTER_DEFAULTS);

  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="duel-filter-screen">
      <div className="duel-banner">
        <span className="duel-banner-icon">⚖️</span>
        <div>
          <h2 className="duel-title">Judge Duel</h2>
          <p className="duel-subtitle">
            Two judges. One stat. You pick — then the truth is revealed.
          </p>
        </div>
      </div>

      <div className="duel-filter-card">
        <h3 className="duel-filter-heading">Set your filters</h3>
        <p className="duel-filter-hint">
          Narrow the judge pool, or leave everything open for the widest variety.
        </p>

        <div className="duel-filter-grid">
          <label className="duel-filter-label">
            State / Region
            <select
              className="duel-filter-select"
              value={filters.state}
              onChange={(e) => set("state", e.target.value)}
            >
              {STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Court Level
            <select
              className="duel-filter-select"
              value={filters.courtLevel}
              onChange={(e) => set("courtLevel", e.target.value)}
            >
              {COURT_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Gender
            <select
              className="duel-filter-select"
              value={filters.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Appointing Party
            <select
              className="duel-filter-select"
              value={filters.party}
              onChange={(e) => set("party", e.target.value)}
            >
              {PARTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Status
            <select
              className="duel-filter-select"
              value={filters.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <button className="duel-start-button" onClick={() => onStart(filters)}>
          Start Duel
        </button>
      </div>
    </div>
  );
}

function DuelCard({ judge, side, isRevealed, isWinner, onSelect, selected, statLabel }) {
  const revealed = isRevealed;

  return (
    <div
      className={[
        "duel-card",
        revealed ? "duel-card-revealed" : "",
        revealed && isWinner ? "duel-card-winner" : "",
        revealed && !isWinner ? "duel-card-loser" : "",
        !revealed && selected ? "duel-card-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={!revealed ? onSelect : undefined}
      role={!revealed ? "button" : undefined}
      tabIndex={!revealed ? 0 : undefined}
      onKeyDown={!revealed ? (e) => e.key === "Enter" && onSelect() : undefined}
    >
      <div className="duel-card-side-label">{side}</div>

      {revealed ? (
        <div className="duel-card-revealed-inner">
          {isWinner && <div className="duel-card-winner-badge">Winner</div>}
          <h3 className="duel-card-name">{judge.fullName}</h3>
          <p className="duel-card-court">{judge.court}</p>
          <div className="duel-card-stat-row">
            <span className="duel-card-stat-value">{judge.statValue}</span>
            <span className="duel-card-stat-unit">{statLabel}</span>
          </div>
          <div className="duel-card-meta-row">
            <span>{judge.gender}</span>
            <span>·</span>
            <span>{judge.partyOfAppointment}</span>
            {judge.yearsOnBench != null && (
              <>
                <span>·</span>
                <span>{judge.yearsOnBench} yrs on bench</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="duel-card-hidden-inner">
          <div className="duel-card-anonymous-icon">?</div>
          <p className="duel-card-court">{judge.court}</p>
          <div className="duel-card-meta-row">
            <span>{judge.gender}</span>
            <span>·</span>
            <span>{judge.partyOfAppointment}</span>
            {judge.yearsOnBench != null && (
              <>
                <span>·</span>
                <span>{judge.yearsOnBench} yrs on bench</span>
              </>
            )}
          </div>
          <p className="duel-card-tap-hint">Tap to pick this judge</p>
        </div>
      )}
    </div>
  );
}

function RoundScreen({ round, totalRounds, score, duelData, onNext, loading }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  React.useEffect(() => {
    setSelected(null);
    setRevealed(false);
  }, [duelData]);

  const handleSelect = (judgeId) => {
    if (revealed) return;
    setSelected(judgeId);
    setRevealed(true);
  };

  const statsPending = duelData && duelData.statsPending;
  const correct = !statsPending && selected != null && duelData != null && selected === duelData.winnerId;

  return (
    <div className="duel-round-screen">
      <div className="duel-round-header">
        <div className="duel-round-info">
          <span className="duel-round-label">Round {round} of {totalRounds}</span>
          <div className="duel-progress-bar">
            <div
              className="duel-progress-fill"
              style={{ width: `${((round - 1) / totalRounds) * 100}%` }}
            />
          </div>
        </div>
        <div className="duel-score-badge">
          Score: {score} / {round - 1}
        </div>
      </div>

      {loading ? (
        <div className="duel-loading">Loading next duel...</div>
      ) : statsPending ? (
        <div className="duel-pending-banner">
          <div className="duel-pending-icon">⏳</div>
          <h3 className="duel-pending-title">Statistics Pending</h3>
          <p className="duel-pending-message">
            {duelData.pendingReason || "Judge statistics have not been computed yet. Run the sync script to populate real data."}
          </p>
          <button className="duel-next-button" onClick={() => onNext(null)}>
            {round < totalRounds ? "Skip Round →" : "See Results →"}
          </button>
        </div>
      ) : (
        <>
          <div className="duel-question-banner">
            <p className="duel-question-text">{duelData.statCategory.question}</p>
          </div>

          <div className="duel-cards-row">
            <DuelCard
              judge={duelData.judgeA}
              side="Judge A"
              isRevealed={revealed}
              isWinner={duelData.judgeA.id === duelData.winnerId}
              onSelect={() => handleSelect(duelData.judgeA.id)}
              selected={selected === duelData.judgeA.id}
              statLabel={duelData.statCategory.unit}
            />
            <div className="duel-vs-badge">VS</div>
            <DuelCard
              judge={duelData.judgeB}
              side="Judge B"
              isRevealed={revealed}
              isWinner={duelData.judgeB.id === duelData.winnerId}
              onSelect={() => handleSelect(duelData.judgeB.id)}
              selected={selected === duelData.judgeB.id}
              statLabel={duelData.statCategory.unit}
            />
          </div>

          {revealed && (
            <div className={`duel-result-banner ${correct ? "duel-result-correct" : "duel-result-wrong"}`}>
              <span className="duel-result-icon">{correct ? "✓" : "✗"}</span>
              <span>{correct ? "Correct! Well spotted." : "Not quite — see the reveal above."}</span>
              <button className="duel-next-button" onClick={() => onNext(correct)}>
                {round < totalRounds ? "Next Round →" : "See Results →"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultsScreen({ score, rounds, onPlayAgain, onChangeFilters }) {
  const pct = Math.round((score / TOTAL_ROUNDS) * 100);

  const verdict =
    pct >= 80
      ? "Legal Eagle"
      : pct >= 60
      ? "Solid Instincts"
      : pct >= 40
      ? "Still Learning"
      : "Better Luck Next Time";

  return (
    <div className="duel-results-screen">
      <div className="duel-results-header">
        <h2 className="duel-results-title">Duel Complete!</h2>
        <div className="duel-results-verdict">{verdict}</div>
        <div className="duel-results-score">
          {score} / {TOTAL_ROUNDS} correct
        </div>
        <div className="duel-results-pct">{pct}% accuracy</div>
      </div>

      <div className="duel-results-breakdown">
        <h3 className="duel-results-breakdown-heading">Round Breakdown</h3>
        {rounds.map((r, i) => (
          <div key={i} className={`duel-results-row ${r.skipped ? "duel-results-row-skipped" : r.correct ? "duel-results-row-correct" : "duel-results-row-wrong"}`}>
            <span className="duel-results-round-num">Round {i + 1}</span>
            <span className="duel-results-question">{r.question}</span>
            <span className="duel-results-outcome">{r.skipped ? "—" : r.correct ? "✓" : "✗"}</span>
          </div>
        ))}
      </div>

      <div className="duel-results-actions">
        <button className="duel-start-button" onClick={onPlayAgain}>
          Play Again (same filters)
        </button>
        <button className="duel-secondary-button" onClick={onChangeFilters}>
          Change Filters
        </button>
      </div>
    </div>
  );
}

const JudgeDuelPage = () => {
  const [phase, setPhase] = useState("filter");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [duelData, setDuelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDuel = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDuelPair(activeFilters);
      setDuelData(data);
    } catch (err) {
      setError("Could not load duel data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = async (selectedFilters) => {
    setFilters(selectedFilters);
    setRound(1);
    setScore(0);
    setRounds([]);
    setPhase("game");
    await loadDuel(selectedFilters);
  };

  const handleNext = async (correct) => {
    const roundRecord = {
      question: duelData.statCategory ? duelData.statCategory.question : "Stats pending",
      correct,
      skipped: correct === null,
    };
    const nextRounds = [...rounds, roundRecord];
    const nextScore = correct === true ? score + 1 : score;

    setRounds(nextRounds);
    setScore(nextScore);

    if (round >= TOTAL_ROUNDS) {
      setPhase("results");
    } else {
      setRound((r) => r + 1);
      await loadDuel(filters);
    }
  };

  const handlePlayAgain = async () => {
    setRound(1);
    setScore(0);
    setRounds([]);
    setPhase("game");
    await loadDuel(filters);
  };

  const handleChangeFilters = () => {
    setPhase("filter");
    setDuelData(null);
  };

  return (
    <div className="duel-page">
      {phase === "filter" && <FilterScreen onStart={handleStart} />}

      {phase === "game" && (
        <>
          {error && (
            <div className="duel-error">
              <span>{error}</span>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="duel-next-button" onClick={() => loadDuel(filters)}>
                  Retry
                </button>
                <button className="duel-secondary-button" onClick={handleChangeFilters}>
                  Change Filters
                </button>
              </div>
            </div>
          )}
          {!error && (
            <RoundScreen
              round={round}
              totalRounds={TOTAL_ROUNDS}
              score={score}
              duelData={duelData}
              onNext={handleNext}
              loading={loading}
            />
          )}
        </>
      )}

      {phase === "results" && (
        <ResultsScreen
          score={score}
          rounds={rounds}
          onPlayAgain={handlePlayAgain}
          onChangeFilters={handleChangeFilters}
        />
      )}
    </div>
  );
};

export default JudgeDuelPage;
