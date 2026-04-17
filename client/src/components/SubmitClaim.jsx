import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_OFFICIALS, SUBMIT_CLAIM } from "../graphql";

export default function SubmitClaim({ onDone }) {
  const { data } = useQuery(GET_OFFICIALS);
  const [submitClaim, { loading }] = useMutation(SUBMIT_CLAIM);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const [form, setForm] = useState({
    officialId: "",
    submittedBy: "",
    type: "GENERAL",
    title: "",
    description: "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitClaim({ variables: { input: form } });
      setSuccess(true);
      timerRef.current = setTimeout(() => onDone(), 2000);
    } catch (err) {
      alert("Failed to submit: " + err.message);
    }
  };

  if (success) {
    return (
      <div className="form-container">
        <div className="success-msg">
          Claim submitted successfully! Redirecting...
        </div>
      </div>
    );
  }

  const officials = data?.officials || [];
  const isValid =
    form.officialId && form.submittedBy && form.title && form.description;

  return (
    <div className="form-container">
      <h2>Submit a Claim</h2>
      <p className="form-desc">
        Report a broken promise, corruption, or any other misconduct by a
        public official. Your claim will be reviewed and verified.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Official</label>
          <select value={form.officialId} onChange={set("officialId")}>
            <option value="">Select an official...</option>
            {officials.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} - {o.position} ({o.state})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Your Name / Handle</label>
          <input
            type="text"
            placeholder="anonymous_citizen"
            value={form.submittedBy}
            onChange={set("submittedBy")}
          />
        </div>

        <div className="form-group">
          <label>Claim Type</label>
          <select value={form.type} onChange={set("type")}>
            <option value="GENERAL">General</option>
            <option value="PROMISE_UPDATE">Promise Update</option>
            <option value="NEW_PROMISE">New Promise</option>
            <option value="ALLEGATION">Allegation</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            placeholder="Brief title for your claim"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Provide as much detail as possible. Include dates, locations, and any evidence you have..."
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={!isValid || loading}
        >
          {loading ? "Submitting..." : "Submit Claim"}
        </button>
      </form>
    </div>
  );
}
