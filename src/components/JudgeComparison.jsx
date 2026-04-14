import React from "react";

const STAT_LABELS = {
  reversal_rate: "Reversal rate",
  opinions_per_year: "Opinions per year",
  years_on_bench: "Years on bench",
  case_volume: "Cases indexed",
  criminal_pct: "Criminal cases %",
  civil_pct: "Civil cases %",
  family_pct: "Family cases %",
  administrative_pct: "Administrative cases %",
};

const PCT_STATS = new Set([
  "reversal_rate",
  "criminal_pct",
  "civil_pct",
  "family_pct",
  "administrative_pct",
]);

function fmt(key, value) {
  if (value === null || value === undefined) return "—";
  if (PCT_STATS.has(key)) return `${(value * 100).toFixed(1)}%`;
  if (key === "opinions_per_year") return value.toFixed(1);
  return Math.round(value).toLocaleString();
}

function ComparisonBar({ statKey, judgeValue, groupAvg, groupLabel }) {
  if (judgeValue === undefined || judgeValue === null) return null;
  const label = STAT_LABELS[statKey] || statKey;
  const hasAvg = groupAvg !== undefined && groupAvg !== null;

  const above = hasAvg && judgeValue > groupAvg;
  const below = hasAvg && judgeValue < groupAvg;

  const maxVal = hasAvg ? Math.max(judgeValue, groupAvg) * 1.25 : judgeValue * 1.25 || 1;
  const judgePct = Math.min(100, (judgeValue / maxVal) * 100);
  const avgPct = hasAvg ? Math.min(100, (groupAvg / maxVal) * 100) : null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "0.85rem" }}>
          <strong>{fmt(statKey, judgeValue)}</strong>
          {hasAvg && (
            <span style={{ color: above ? "var(--accent)" : below ? "#c0392b" : "#888", marginLeft: "0.5rem" }}>
              {above ? "▲" : below ? "▼" : "="} avg {fmt(statKey, groupAvg)}
            </span>
          )}
        </span>
      </div>
      <div style={{ position: "relative", height: "8px", background: "#e8e8e8", borderRadius: "4px", overflow: "visible" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "8px",
            width: `${judgePct}%`,
            background: above ? "var(--accent, #1a73e8)" : below ? "#c0392b" : "#1a73e8",
            borderRadius: "4px",
            transition: "width 0.4s",
          }}
        />
        {avgPct !== null && (
          <div
            style={{
              position: "absolute",
              left: `${avgPct}%`,
              top: "-3px",
              width: "2px",
              height: "14px",
              background: "#555",
              borderRadius: "1px",
            }}
            title={`${groupLabel} avg: ${fmt(statKey, groupAvg)}`}
          />
        )}
      </div>
    </div>
  );
}

function GroupSection({ title, judgeStats, groupAverages }) {
  const keys = Object.keys(STAT_LABELS).filter(
    (k) => judgeStats[k] !== undefined
  );
  if (keys.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h5 style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>
        vs. {title}
      </h5>
      {keys.map((k) => (
        <ComparisonBar
          key={k}
          statKey={k}
          judgeValue={judgeStats[k]}
          groupAvg={groupAverages ? groupAverages[k] : undefined}
          groupLabel={title}
        />
      ))}
    </div>
  );
}

const JudgeComparison = ({ statsData }) => {
  if (statsData === null) {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p className="small-label">Comparative stats</p>
        <h3 className="section-heading">How does this judge compare?</h3>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>
          Comparative statistics are unavailable for this judge right now.
        </p>
      </section>
    );
  }

  if (statsData === undefined) {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p className="small-label">Comparative stats</p>
        <h3 className="section-heading">How does this judge compare?</h3>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>
          Loading comparative statistics...
        </p>
      </section>
    );
  }

  if (!statsData.hasStats) {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p className="small-label">Comparative stats</p>
        <h3 className="section-heading">How does this judge compare?</h3>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>
          Stats for this judge have not been computed yet. They will be available after the next scheduled stats refresh.
        </p>
      </section>
    );
  }

  const { judgeStats, groups, similarStates } = statsData;

  const hasSimilarStates =
    similarStates &&
    similarStates.mostSimilar &&
    similarStates.mostSimilar.length > 0;

  return (
    <section style={{ marginTop: "2rem" }}>
      <p className="small-label">Comparative stats</p>
      <h3 className="section-heading">How does this judge compare?</h3>

      <div className="card-grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <GroupSection
            title="National average"
            judgeStats={judgeStats}
            groupAverages={groups.national}
          />
          {groups.state && groups.state.name && (
            <GroupSection
              title={`${groups.state.name} average`}
              judgeStats={judgeStats}
              groupAverages={groups.state.averages}
            />
          )}
        </article>

        <article className="card">
          {groups.courtType && groups.courtType.name && (
            <GroupSection
              title={`${groups.courtType.name} court average`}
              judgeStats={judgeStats}
              groupAverages={groups.courtType.averages}
            />
          )}
          {groups.party && groups.party.name && (
            <GroupSection
              title={`${groups.party.name} appointees`}
              judgeStats={judgeStats}
              groupAverages={groups.party.averages}
            />
          )}
        </article>
      </div>

      {hasSimilarStates && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h4 className="card-title">Most similar to judges in...</h4>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {similarStates.mostSimilar.map((s, i) => (
              <div key={s.state} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{s.state}</div>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>#{i + 1} closest</div>
              </div>
            ))}
          </div>
          {similarStates.mostDifferent && similarStates.mostDifferent.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h4 className="card-title" style={{ marginTop: 0 }}>Most different from judges in...</h4>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {similarStates.mostDifferent.map((s, i) => (
                  <div key={s.state} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{s.state}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>#{i + 1} most different</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default JudgeComparison;
