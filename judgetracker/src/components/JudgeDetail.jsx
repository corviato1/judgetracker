import React from "react";

const JudgeDetail = ({ judge }) => {
  if (!judge) return null;

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <p className="small-label">Judge profile</p>
      <h2 className="section-heading">{judge.fullName}</h2>
      <p className="section-subheading">
        {judge.courtName} · {judge.jurisdiction}
      </p>

      <div className="card-grid">
        <article className="card">
          <h4 className="card-title">Appointment</h4>
          <p className="card-description">
            Appointed by <strong>{judge.appointer}</strong>{" "}
            {judge.partyOfAppointment && (
              <>
                ({judge.partyOfAppointment}
                {" party"})
              </>
            )}
            .
          </p>
          {judge.serviceStartYear && (
            <p className="card-description">
              On the bench since <strong>{judge.serviceStartYear}</strong>.
            </p>
          )}
        </article>

        <article className="card">
          <h4 className="card-title">Docket footprint</h4>
          <p className="card-description">
            Sample data shows coverage across{" "}
            <strong>{judge.sampleCaseCount}</strong> indexed cases, including
            both civil and criminal matters.
          </p>
        </article>
      </div>
    </section>
  );
};

export default JudgeDetail;
