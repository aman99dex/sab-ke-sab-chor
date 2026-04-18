import { useEffect, useState } from "react";

const TASKS = [
  { id: "GLOBAL_PERSON_RESEARCH", label: "Research Person" },
  { id: "VERIFY_CLAIM", label: "Verify Claim" },
  { id: "SCRAPE_STRATEGY", label: "Scrape Strategy" },
  { id: "QUEUE_SCRAPE_JOB", label: "Queue Scrape Job" },
];

const TERMINAL_JOB_STATUSES = new Set(["COMPLETED", "FAILED"]);

export default function AgentTaskPanel() {
  const [taskType, setTaskType] = useState("GLOBAL_PERSON_RESEARCH");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scrapeJob, setScrapeJob] = useState(null);

  useEffect(() => {
    if (!scrapeJob?.id || TERMINAL_JOB_STATUSES.has(scrapeJob.status)) return undefined;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/agents/scrape-jobs/${encodeURIComponent(scrapeJob.id)}`);
        if (!response.ok) return;
        const latest = await response.json();
        setScrapeJob(latest);
      } catch {
        // Keep silent; panel already shows latest known state.
      }
    }, 1400);

    return () => clearInterval(timer);
  }, [scrapeJob?.id, scrapeJob?.status]);

  async function runTask() {
    setRunning(true);
    setError("");
    setResult(null);
    setScrapeJob(null);

    if (taskType === "QUEUE_SCRAPE_JOB") {
      const officialId = subject.trim();
      const payload = {
        type: officialId ? "OFFICIAL_NEWS_SCRAPE" : "FULL_NEWS_SCRAPE",
        officialId: officialId || undefined,
      };

      try {
        const response = await fetch("/api/agents/scrape-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (!response.ok) {
          setError(json?.error || "Could not queue scrape job.");
          return;
        }
        setScrapeJob(json);
      } catch {
        setError("Could not queue scrape job. Is backend running?");
      } finally {
        setRunning(false);
      }
      return;
    }

    const payload =
      taskType === "VERIFY_CLAIM"
        ? {
            officialName: subject,
            claimTitle: details || "User-submitted claim",
            claimDescription: details,
          }
        : taskType === "SCRAPE_STRATEGY"
          ? { topic: subject || details || "india corruption data sources" }
          : { name: subject || details };

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, payload }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json?.error || "Task failed.");
        return;
      }
      setResult(json);
    } catch {
      setError("Could not run agent task. Is backend running?");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="agent-panel">
      <div className="agent-panel-head">
        <h3>AI Agent Tasks</h3>
        <span>Run automated task workflows on live data sources.</span>
      </div>

      <div className="agent-task-buttons">
        {TASKS.map((task) => (
          <button
            key={task.id}
            className={`filter-chip ${taskType === task.id ? "active" : ""}`}
            onClick={() => setTaskType(task.id)}
          >
            {task.label}
          </button>
        ))}
      </div>

      {taskType === "QUEUE_SCRAPE_JOB" && (
        <div className="scrape-job-note">
          Enter an official ID for a focused scrape, or leave it blank to queue a full platform scrape.
        </div>
      )}

      <div className="agent-inputs">
        <input
          className="search-box"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={
            taskType === "VERIFY_CLAIM"
              ? "Official name"
              : taskType === "QUEUE_SCRAPE_JOB"
                ? "Optional official ID (leave blank for full scrape)"
                : "Primary subject"
          }
        />
        <textarea
          className="agent-textarea"
          rows={4}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={
            taskType === "VERIFY_CLAIM"
              ? "Claim details to verify"
              : taskType === "QUEUE_SCRAPE_JOB"
                ? "Optional notes for your own tracking"
                : "Optional context or constraints"
          }
        />
      </div>

      <button className="btn-primary" onClick={runTask} disabled={running}>
        {running ? "Running agent..." : "Run Task"}
      </button>

      {error && <div className="error-msg" style={{ marginTop: 14 }}>{error}</div>}

      {scrapeJob && (
        <div className="scrape-job-card">
          <div className="scrape-job-head">
            <strong>{scrapeJob.type}</strong>
            <span className={`status ${String(scrapeJob.status || "").toLowerCase()}`}>{scrapeJob.status}</span>
          </div>
          <div className="scrape-job-progress">
            <div style={{ width: `${Math.max(0, Math.min(100, scrapeJob.progress || 0))}%` }} />
          </div>
          <div className="scrape-job-meta">{scrapeJob.progress || 0}% complete · Job ID: {scrapeJob.id}</div>
          {scrapeJob.logs?.length > 0 && (
            <pre className="scrape-job-logs">{scrapeJob.logs.slice(-8).join("\n")}</pre>
          )}
        </div>
      )}

      {result && (
        <pre className="agent-result-block">{JSON.stringify(result, null, 2)}</pre>
      )}
    </section>
  );
}
