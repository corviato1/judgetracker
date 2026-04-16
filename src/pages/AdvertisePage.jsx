import React, { useState } from "react";
import AdSpots from "../components/AdSpots";

const AdvertisePage = () => {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/ads/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true });
        setForm({ name: "", company: "", email: "", message: "" });
      } else {
        setStatus({ ok: false, message: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setStatus({ ok: false, message: "Could not reach the server. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="advertise-page">
      <div className="advertise-left">
        <p className="advertise-eyebrow">Advertise on JudgeTracker</p>
        <h1 className="advertise-headline">
          Reach citizens who care about the judiciary and want to be better informed
        </h1>

        <ul className="advertise-bullets">
          <li>
            <span className="advertise-bullet-dot" />
            Target litigators, policy teams, and legal researchers by court or jurisdiction
          </li>
          <li>
            <span className="advertise-bullet-dot" />
            Placements are clearly labeled and kept separate from search results
          </li>
          <li>
            <span className="advertise-bullet-dot" />
            Flexible options — full-width banner, contextual in-feed, or sidebar module
          </li>
          <li>
            <span className="advertise-bullet-dot" />
            We review every placement for editorial independence
          </li>
        </ul>

        <AdSpots pageKey="advertise" />

        <p className="advertise-footnote">
          Interested in a data or analytics partnership instead?{" "}
          Use the form and mention it in your message.
        </p>
      </div>

      <div className="advertise-right">
        <div className="advertise-form-card">
          <h2 className="advertise-form-title">Request a placement</h2>

          {status?.ok ? (
            <div className="advertise-success">
              <p style={{ fontWeight: 600, marginBottom: "0.4rem" }}>Request received</p>
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                We will review your inquiry and follow up within two business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="advertise-form">
              <input
                className="advertise-input"
                type="text"
                placeholder="Full name *"
                value={form.name}
                onChange={set("name")}
                required
              />
              <input
                className="advertise-input"
                type="text"
                placeholder="Company or firm"
                value={form.company}
                onChange={set("company")}
              />
              <input
                className="advertise-input"
                type="email"
                placeholder="Work email *"
                value={form.email}
                onChange={set("email")}
                required
              />
              <textarea
                className="advertise-input advertise-textarea"
                placeholder="Tell us about your goals or campaign (optional)"
                value={form.message}
                onChange={set("message")}
                rows={4}
              />
              {status?.ok === false && (
                <p className="advertise-error">{status.message}</p>
              )}
              <button
                className="advertise-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisePage;
