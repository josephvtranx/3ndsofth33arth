type Props = {
  className?: string;
  size: number | string;
  dot: number;
  gap: number;
  color?: string;
  inner?: number;
  outer?: number;
};

/** Soft halftone dot cluster — decorative, pointer-transparent. */
export default function Halftone({
  className = "",
  size,
  dot,
  gap,
  color = "#e0e0e0",
  inner = 20,
  outer = 70,
}: Props) {
  const mask = `radial-gradient(circle, black ${inner}%, transparent ${outer}%)`;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `radial-gradient(circle, ${color} ${dot}px, transparent ${dot + 0.3}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}
