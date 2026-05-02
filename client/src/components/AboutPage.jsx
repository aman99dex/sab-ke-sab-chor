import { useQuery } from "@apollo/client/react";
import { GET_STATS_SUMMARY } from "../graphql";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const { data } = useQuery(GET_STATS_SUMMARY);
  const stats = data?.statsSummary;
  const navigate = useNavigate();

  return (
    <div className="full-page about-page">
      <div className="about-hero">
        <h1 className="about-title">
          <span className="gradient-text">नेता Watch</span>
        </h1>
        <p className="about-tagline">
          India's open-source political accountability platform — tracking every promise, allegation,
          and court case from Parliament to Gram Panchayat.
        </p>
      </div>

      {stats && (
        <div className="about-stats-grid">
          {[
            { val: stats.totalOfficials, label: "Officials Tracked", color: "var(--accent-bright)" },
            { val: stats.statesTracked, label: "States Covered", color: "var(--blue-bright)" },
            { val: stats.totalAllegations, label: "Allegations Filed", color: "var(--orange-bright)" },
            { val: stats.totalCourtCases, label: "Court Cases", color: "var(--red)" },
            { val: stats.totalPromises, label: "Promises Logged", color: "var(--green-bright)" },
            { val: stats.totalClaims, label: "Citizen Claims", color: "var(--purple)" },
          ].map((s) => (
            <div key={s.label} className="about-stat-box">
              <div className="asb-val" style={{ color: s.color }}>{s.val?.toLocaleString("en-IN")}</div>
              <div className="asb-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="about-sections">
        <section className="about-section">
          <h2>🎯 Mission</h2>
          <p>
            Neta Watch exists to make Indian governance transparent and citizens powerful.
            We aggregate public data — ECI affidavits, court records, RTI responses, Lok Sabha debates,
            and live news — into one searchable, AI-verified platform accessible to everyone.
          </p>
        </section>

        <section className="about-section">
          <h2>⚙️ How It Works</h2>
          <div className="about-how-grid">
            <div className="about-how-card">
              <div className="ahc-icon">🔍</div>
              <h3>Data Collection</h3>
              <p>Our scraper runs every 30 minutes pulling news from 10+ Indian media sources via Google News RSS. Daily AI agents re-scan Wikipedia, Indian Kanoon, and Sansad.in for updates.</p>
            </div>
            <div className="about-how-card">
              <div className="ahc-icon">🤖</div>
              <h3>AI Verification</h3>
              <p>Every citizen claim goes through a 3-tier AI pipeline: Groq Llama 3 → HuggingFace BART-NLI → keyword fallback. Each claim gets a confidence score and verdict.</p>
            </div>
            <div className="about-how-card">
              <div className="ahc-icon">📊</div>
              <h3>Public Dashboard</h3>
              <p>All data is public — searchable by state, constituency, party, or name. Filter by national MPs, MLAs, district collectors, or gram pradhans.</p>
            </div>
            <div className="about-how-card">
              <div className="ahc-icon">👥</div>
              <h3>Citizen Reporting</h3>
              <p>Any citizen can submit a claim, broken promise report, or corruption allegation. Claims are AI-verified instantly and reviewed by our volunteer network.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🗄️ Data Sources</h2>
          <div className="about-sources-grid">
            {[
              { name: "Election Commission of India", url: "https://eci.gov.in", desc: "Affidavits, asset declarations, criminal records (Form 26)" },
              { name: "Sansad.in", url: "https://sansad.in", desc: "Lok Sabha / Rajya Sabha debates and member profiles" },
              { name: "MyNeta.info", url: "https://myneta.info", desc: "Candidate profiles from ADR / National Election Watch" },
              { name: "Indian Kanoon", url: "https://indiankanoon.org", desc: "Court case judgments and legal documents" },
              { name: "Google News RSS", url: "#", desc: "Live news aggregation from 10+ Indian publications" },
              { name: "Wikipedia", url: "https://wikipedia.org", desc: "Biographical data via MediaWiki API" },
            ].map((s) => (
              <div key={s.name} className="source-card">
                <div className="sc-name">
                  <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                </div>
                <div className="sc-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>🤝 AI Stack (All Free / Open Source)</h2>
          <div className="about-ai-grid">
            <div className="ai-stack-card">
              <div className="asc-tier">Tier 1</div>
              <div className="asc-name">Groq · Llama 3.3 70B</div>
              <div className="asc-desc">Primary fact-checker — 1,000 free calls/day. Used for structured JSON verdict (VERIFIED / LIKELY_FALSE / UNVERIFIABLE) with confidence score and source suggestions.</div>
            </div>
            <div className="ai-stack-card">
              <div className="asc-tier">Tier 2</div>
              <div className="asc-name">HuggingFace · BART-MNLI</div>
              <div className="asc-desc">Zero-shot NLI classifier. Fallback when Groq quota is exceeded. Labels claims against labels: factual, credible allegation, misleading, false.</div>
            </div>
            <div className="ai-stack-card">
              <div className="asc-tier">Tier 3</div>
              <div className="asc-name">Keyword Analysis (Offline)</div>
              <div className="asc-desc">No-API fallback. Scores claims using 40+ red-flag and credibility indicator keywords — still produces a 0-100 confidence estimate.</div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🔒 Principles</h2>
          <ul className="about-principles">
            <li><strong>No editorializing</strong> — We show data, not opinions. Allegations are labeled by status (investigating / unverified), not presented as facts.</li>
            <li><strong>Source attribution</strong> — Every data point links back to its primary source.</li>
            <li><strong>AI transparency</strong> — AI verdicts show confidence scores, not just binary labels.</li>
            <li><strong>Right of reply</strong> — Officials can request corrections through the standard RTI mechanism.</li>
            <li><strong>Open source</strong> — Full codebase is open for audit and contribution.</li>
          </ul>
        </section>
      </div>

      <div className="about-cta">
        <button className="btn-primary" onClick={() => navigate("/submit")}>Submit a Claim →</button>
        <button className="btn-ghost" onClick={() => navigate("/officials")}>Browse Officials</button>
      </div>
    </div>
  );
}
