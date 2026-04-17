import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { SUBMIT_CLAIM, GET_OFFICIALS } from "../graphql";

export default function SubmitClaim({ onDone }) {
  const [form, setForm] = useState({
    officialId: "",
    submittedBy: "",
    type: "PROMISE_UPDATE",
    title: "",
    description: "",
    linkedPromiseId: "",
    linkedAllegationId: "",
  });
  const [submitted, setSubmitted] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: officialsData } = useQuery(GET_OFFICIALS);
  const [submitClaim] = useMutation(SUBMIT_CLAIM);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.officialId || !form.title || !form.description || !form.submittedBy) return;
    setIsSubmitting(true);

    try {
      const input = {
        officialId: form.officialId,
        submittedBy: form.submittedBy,
        type: form.type,
        title: form.title,
        description: form.description,
        linkedPromiseId: form.linkedPromiseId || undefined,
        linkedAllegationId: form.linkedAllegationId || undefined,
      };

      const { data } = await submitClaim({ variables: { input } });
      setSubmitted(data.submitClaim);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const isAiVerified = submitted.aiVerificationNote;
    return (
      <div className="success-container">
        <div className="success-icon">✅</div>
        <h2>Claim Submitted!</h2>
        <p>Your claim has been recorded and will be reviewed.</p>

        <div className="success-detail">
          <div className="success-row">
            <span>Claim ID</span>
            <code>#{submitted.id}</code>
          </div>
          <div className="success-row">
            <span>Status</span>
            <span className={`status ${submitted.status.toLowerCase()}`}>{submitted.status}</span>
          </div>
        </div>

        {isAiVerified ? (
          <div className="ai-result-card">
            <div className="ai-result-header">
              <span>🤖</span> AI Verification Result
              {submitted.aiConfidence != null && (
                <span className="confidence-badge">{submitted.aiConfidence}% confidence</span>
              )}
            </div>
            <p className="ai-result-text">{submitted.aiVerificationNote}</p>
          </div>
        ) : (
          <div className="ai-pending-card">
            <span>⏳</span> AI verification is running in the background. Check back in a minute.
          </div>
        )}

        <div className="success-actions">
          <button className="btn-primary" onClick={() => { setSubmitted(null); setForm({ officialId: "", submittedBy: "", type: "PROMISE_UPDATE", title: "", description: "", linkedPromiseId: "", linkedAllegationId: "" }); }}>
            Submit Another
          </button>
          <button className="btn-ghost" onClick={onDone}>
            Back to Officials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Submit a Claim</h2>
        <p className="form-desc">
          Report broken promises, corruption, or missing government work. All claims are
          AI-verified and reviewed by our volunteer network.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Official *</label>
          <select name="officialId" value={form.officialId} onChange={handleChange} required>
            <option value="">— Choose an official —</option>
            {officialsData?.officials?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.position}, {o.state})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Claim Type *</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="PROMISE_UPDATE">Promise Not Kept</option>
            <option value="ALLEGATION">Corruption / Misconduct</option>
            <option value="NEW_PROMISE">New Promise Made</option>
            <option value="GENERAL">General Report</option>
          </select>
        </div>

        <div className="form-group">
          <label>Claim Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Short, factual title — e.g. 'No construction started on promised school'"
            required
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide specific details — location, dates, evidence you have, RTI references, etc."
            required
            rows={5}
          />
        </div>

        <div className="form-group">
          <label>Your Name / Handle *</label>
          <input
            type="text"
            name="submittedBy"
            value={form.submittedBy}
            onChange={handleChange}
            placeholder="e.g. anonymous_citizen or your name"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Linked Promise ID (optional)</label>
            <input
              type="text"
              name="linkedPromiseId"
              value={form.linkedPromiseId}
              onChange={handleChange}
              placeholder="e.g. 3"
            />
          </div>
          <div className="form-group">
            <label>Linked Allegation ID (optional)</label>
            <input
              type="text"
              name="linkedAllegationId"
              value={form.linkedAllegationId}
              onChange={handleChange}
              placeholder="e.g. 1"
            />
          </div>
        </div>

        <div className="ai-disclaimer">
          🤖 <strong>AI Auto-Verification:</strong> Your claim will be analyzed by our AI model
          (HuggingFace BART-NLI) for factual consistency. This does not replace human review.
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <><span className="loading-spinner sm" /> Submitting & Running AI Verification...</>
          ) : (
            "Submit Claim →"
          )}
        </button>
      </form>
    </div>
  );
}
