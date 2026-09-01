export function SealMark({
  className = "",
  animate = false,
  style,
}: {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${animate ? "seal-mark" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.9" />
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
      <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
      <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.35" />
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 50 + 47 * Math.cos(angle);
        const y1 = 50 + 47 * Math.sin(angle);
        const x2 = 50 + 44 * Math.cos(angle);
        const y2 = 50 + 44 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}
