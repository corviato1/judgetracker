import React from "react";

const DataSourcesPage = () => {
  return (
    <div>
      <h2 className="section-heading">Data and coverage</h2>
      <p className="section-subheading">
        JudgeTracker.info relies on public case law, structured feeds, and
        open-licensed sources. We never scrape around access rules or reproduce
        sealed documents.
      </p>

      <div className="card-grid">
        <article className="card">
          <h4 className="card-title">Public case law</h4>
          <p className="card-description">
            Opinions and orders published by courts in the United States are
            public domain. These are ingested through open projects, bulk
            downloads, and official feeds where available.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Docket and filing metadata</h4>
          <p className="card-description">
            For each judge, the system tracks dockets, case numbers, and
            basic party information, without exposing sensitive sealed
            documents or private identifiers.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Ethics and transparency</h4>
          <p className="card-description">
            All data sources, last update times, and known coverage gaps are
            clearly labeled. Every statistical output includes caveats and
            methodology summaries.
          </p>
        </article>
      </div>
    </div>
  );
};

export default DataSourcesPage;
