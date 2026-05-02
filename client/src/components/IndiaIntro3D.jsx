import { useState } from "react";
import IndiaMapSVG from "./IndiaMapSVG";
import Background3D from "../Background3D";

export default function IndiaIntro3D({ onEnter, isExiting }) {
  const [selectedState, setSelectedState] = useState(null);
  const [launching, setLaunching] = useState(false);

  const handleStateClick = (stateName) => {
    setSelectedState(stateName);
  };

  const triggerLaunch = () => {
    if (launching || isExiting) return;
    setLaunching(true);
    setTimeout(() => onEnter(), 700);
  };

  return (
    <section className={`india-intro-wrap${launching || isExiting ? " exiting" : ""}`}>
      <div className="intro-bg-layer">
        <Background3D mode="intro" />
      </div>

      <div className="india-intro-layout">
        {/* Left panel — branding + CTA */}
        <div className="intro-left-panel">
          <div className="intro-badge">
            <span className="badge-dot" />
            National Accountability Grid · Live
          </div>

          <h1 className="intro-headline">
            <span className="headline-neta">नेता Watch</span>
            <br />
            <span className="headline-sub">Track Every Promise.</span>
            <br />
            <span className="headline-sub2">Expose Every Allegation.</span>
          </h1>

          <p className="intro-desc">
            India's largest open database of politicians, bureaucrats, court cases,
            RTI responses, and citizen claims — searchable by state, constituency, or name.
          </p>

          <div className="intro-stats-row">
            <div className="intro-stat">
              <span className="ist-val">543</span>
              <span className="ist-lbl">Lok Sabha MPs</span>
            </div>
            <div className="intro-stat">
              <span className="ist-val">4,033</span>
              <span className="ist-lbl">MLAs Tracked</span>
            </div>
            <div className="intro-stat">
              <span className="ist-val">28</span>
              <span className="ist-lbl">States</span>
            </div>
          </div>

          {selectedState && (
            <div className="state-preview-chip">
              <span className="spc-dot" />
              {selectedState} selected · click Launch to explore
            </div>
          )}

          <div className="intro-actions">
            <button
              className={`btn-primary${launching ? " loading" : ""}`}
              onClick={triggerLaunch}
              disabled={launching || isExiting}
            >
              {launching ? "Loading…" : "Launch Dashboard →"}
            </button>
          </div>

          <div className="intro-sources">
            Data sourced from ECI · Sansad.in · MyNeta.info · Indian Kanoon
          </div>
        </div>

        {/* Right panel — India map */}
        <div className="intro-right-panel">
          <div className="map-glow-ring" />
          <IndiaMapSVG onStateClick={handleStateClick} />
          <div className="map-caption">
            Hover a state to highlight · Click to select
          </div>
        </div>
      </div>
    </section>
  );
}
