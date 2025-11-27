import React from "react";

const DataSourcesPage = () => {
  return (
    <div>
      <h2 className="section-heading">Data and coverage (demo description)</h2>
      <p className="section-subheading">
        In the production system, JudgeTracker.info will never scrape around
        access rules. It will rely on public case law, structured feeds, and
        partnered data sources with clear licenses.
      </p>

      <div className="card-grid">
        <article className="card">
          <h4 className="card-title">Public case law</h4>
          <p className="card-description">
            Opinions and orders published by courts in the United States are
            public domain. These can be ingested through open projects, bulk
            downloads, and official feeds where available.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Docket and filing metadata</h4>
          <p className="card-description">
            For each judge, the system will track dockets, case numbers, and
            basic party information, without exposing sensitive sealed
            documents or private identifiers.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Ethics and transparency</h4>
          <p className="card-description">
            The application will clearly label data sources, last update times,
            and known limitations. Any statistical output will include caveats
            and methodology summaries.
          </p>
        </article>
      </div>
    </div>
  );
};

export default DataSourcesPage;
