import { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_STATS_SUMMARY } from "../graphql";

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const start = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    if (!target) return;
    start.current = null;

    const animate = (timestamp) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return count;
}

function StatCard({ icon, label, value, sub, color = "var(--accent)", delay = 0 }) {
  const count = useCountUp(value, 1600);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="hero-stat" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
      <div className="hero-stat-icon" style={{ color }}>{icon}</div>
      <div className="hero-stat-value" style={{ color }}>{count.toLocaleString("en-IN")}</div>
      <div className="hero-stat-label">{label}</div>
      {sub && <div className="hero-stat-sub">{sub}</div>}
    </div>
  );
}

export default function HeroSection({ onExplore }) {
  const { data } = useQuery(GET_STATS_SUMMARY);
  const stats = data?.statsSummary;

  return (
    <section className="hero-section">
      {/* Tagline */}
      <div className="hero-eyebrow">🇮🇳 Open Source Political Accountability</div>
      <h1 className="hero-title">
        Hold Power
        <br />
        <span className="gradient-text">Accountable</span>
      </h1>
      <p className="hero-desc">
        Track every promise, allegation, and verified claim against Indian politicians &amp;
        bureaucrats — from Parliament to your Gram Panchayat.
      </p>

      <div className="hero-actions">
        <button className="btn-primary" onClick={onExplore}>
          Explore Officials ↓
        </button>
        <a className="btn-ghost" href="#submit" onClick={(e) => { e.preventDefault(); onExplore("submit"); }}>
          Submit a Claim
        </a>
      </div>

      {/* Animated Stats */}
      {stats && (
        <div className="hero-stats">
          <StatCard icon="👤" label="Officials Tracked" value={stats.totalOfficials}
            sub={`${stats.statesTracked} states`} color="var(--accent-bright)" delay={200} />
          <StatCard icon="📋" label="Promises Logged" value={stats.totalPromises}
            sub={`${stats.completedPromises} fulfilled`} color="var(--blue-bright)" delay={350} />
          <StatCard icon="⚠️" label="Allegations Filed" value={stats.totalAllegations}
            sub={`${stats.highSeverityAllegations} high severity`} color="var(--orange-bright)" delay={500} />
          <StatCard icon="🔍" label="Citizen Claims" value={stats.totalClaims}
            sub={`${stats.verifiedClaims} verified`} color="var(--green-bright)" delay={650} />
        </div>
      )}

      {/* Trust badges */}
      <div className="hero-trust">
        <span>🔓 Open Source</span>
        <span>🤖 AI Verified</span>
        <span>📰 Live News</span>
        <span>🗺️ Village to Parliament</span>
      </div>
    </section>
  );
}
