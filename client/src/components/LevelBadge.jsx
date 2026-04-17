const LEVEL_CONFIG = {
  NATIONAL:  { label: "National",  icon: "🏛️", color: "var(--level-national)",  glow: "var(--level-national-glow)"  },
  STATE:     { label: "State",     icon: "🗺️", color: "var(--level-state)",     glow: "var(--level-state-glow)"     },
  DISTRICT:  { label: "District",  icon: "🏙️", color: "var(--level-district)",  glow: "var(--level-district-glow)"  },
  BLOCK:     { label: "Block",     icon: "🏘️", color: "var(--level-block)",     glow: "var(--level-block-glow)"     },
  PANCHAYAT: { label: "Panchayat", icon: "🌾", color: "var(--level-panchayat)", glow: "var(--level-panchayat-glow)" },
};

export default function LevelBadge({ level, size = "sm" }) {
  if (!level || !LEVEL_CONFIG[level]) return null;
  const { label, icon, color, glow } = LEVEL_CONFIG[level];

  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: size === "sm" ? "4px" : "6px",
    padding: size === "sm" ? "3px 9px" : "5px 12px",
    borderRadius: "6px",
    fontSize: size === "sm" ? "11px" : "13px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    color,
    background: glow,
    border: `1px solid ${color}40`,
  };

  return (
    <span style={style}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

export { LEVEL_CONFIG };
