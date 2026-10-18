import type { CSSProperties } from "react";

type LogoVariant = "mark" | "horizontal" | "stacked";

type LogoProps = {
  variant?: LogoVariant;
  size?: number;
  onDark?: boolean;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

const GRADIENT_ID_PREFIX = "ds-logo";

let instanceCounter = 0;
const useInstanceId = () => {
  instanceCounter += 1;
  return `${GRADIENT_ID_PREFIX}-${instanceCounter}`;
};

function MarkArt({ id, framed }: { id: string; framed: boolean }) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-petal`} x1="16" y1="6" x2="48" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5aa0a0" />
          <stop offset="0.5" stopColor="#2d6a6a" />
          <stop offset="1" stopColor="#0c3434" />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.42" cy="0.36" r="0.72">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="1" />
          <stop offset="0.5" stopColor="#f6ecce" stopOpacity="0.95" />
          <stop offset="1" stopColor="#dcc89a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.6" stopColor="#2d6a6a" stopOpacity="0" />
          <stop offset="0.86" stopColor="#2d6a6a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#2d6a6a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {framed ? <rect x="2" y="2" width="60" height="60" rx="14" fill="#f5f5f0" /> : null}

      {!framed ? <circle cx="32" cy="32" r="30" fill={`url(#${id}-halo)`} /> : null}

      <path
        d="M32 6
           C 44 8, 54 18, 56 32
           C 57.5 44, 50 56, 38 58.4
           C 34 59.2, 30 59.2, 26 58.4
           C 14 56, 6.5 44, 8 32
           C 10 18, 20 8, 32 6 Z"
        fill={`url(#${id}-petal)`}
      />

      <path
        d="M32 6
           C 44 8, 54 18, 56 32
           C 57.5 44, 50 56, 38 58.4
           C 34 59.2, 30 59.2, 26 58.4
           C 14 56, 6.5 44, 8 32
           C 10 18, 20 8, 32 6 Z"
        fill={`url(#${id}-sheen)`}
      />

      <path
        d="M11 40 C 20 36, 44 36, 53 40"
        stroke="rgb(255 255 255 / 0.22)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M13 47 C 22 44, 42 44, 51 47"
        stroke="rgb(255 255 255 / 0.16)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 53 C 24 51, 40 51, 48 53"
        stroke="rgb(255 255 255 / 0.10)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      <circle
        cx="32"
        cy="28"
        r="8.2"
        fill="none"
        stroke="rgb(245 233 200 / 0.35)"
        strokeWidth="0.8"
      />
      <circle cx="32" cy="28" r="6.6" fill={`url(#${id}-orb)`} />
      <circle cx="30.4" cy="26.4" r="1.9" fill="#fffdf5" />

      <g opacity="0.92">
        <path
          d="M44 18 L44.6 20.2 L46.8 20.8 L44.6 21.4 L44 23.6 L43.4 21.4 L41.2 20.8 L43.4 20.2 Z"
          fill="#f6ecce"
        />
      </g>
    </svg>
  );
}

export function Logo({
  variant = "mark",
  size = 40,
  onDark = false,
  showTagline = true,
  tagline = "AI \u00B7 Dermatology Co\u2011Pilot",
  className,
  style,
  title = "DermaSoul AI",
}: LogoProps) {
  const id = useInstanceId();

  const wordmarkSize = Math.round(size * 0.56);
  const taglineSize = Math.max(9, Math.round(size * 0.2));

  const wordmarkPrimary = onDark ? "#ffffff" : "#0f3d3e";
  const wordmarkAccent = onDark ? "rgba(255, 255, 255, 0.86)" : "#2d6a6a";
  const taglineColor = onDark ? "rgba(255, 255, 255, 0.76)" : "#3a7a7a";

  if (variant === "mark") {
    return (
      <span
        className={className}
        role="img"
        aria-label={title}
        style={{
          display: "inline-flex",
          width: size,
          height: size,
          ...style,
        }}
      >
        <MarkArt id={id} framed={onDark} />
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span
        className={className}
        role="img"
        aria-label={title}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(size * 0.18),
          ...style,
        }}
      >
        <span style={{ display: "inline-flex", width: size, height: size }}>
          <MarkArt id={id} framed={onDark} />
        </span>
        <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05 }}>
          <span
            style={{
              fontFamily: "'Inter','Helvetica Neue',system-ui,sans-serif",
              fontSize: wordmarkSize,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: wordmarkPrimary,
            }}
          >
            Derma<span style={{ color: wordmarkAccent }}>Soul</span>
          </span>
          {showTagline ? (
            <span
              style={{
                marginTop: Math.round(size * 0.08),
                fontFamily: "'Inter','Helvetica Neue',system-ui,sans-serif",
                fontSize: taglineSize,
                fontWeight: 600,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: taglineColor,
              }}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span
      className={className}
      role="img"
      aria-label={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.3),
        ...style,
      }}
    >
      <span style={{ display: "inline-flex", width: size, height: size, flex: "0 0 auto" }}>
        <MarkArt id={id} framed={onDark} />
      </span>
      <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: "'Inter','Helvetica Neue',system-ui,sans-serif",
            fontSize: wordmarkSize,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: wordmarkPrimary,
          }}
        >
          Derma<span style={{ color: wordmarkAccent }}>Soul</span>
        </span>
        {showTagline ? (
          <span
            style={{
              marginTop: Math.round(size * 0.05),
              fontFamily: "'Inter','Helvetica Neue',system-ui,sans-serif",
              fontSize: taglineSize,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: taglineColor,
            }}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default Logo;
