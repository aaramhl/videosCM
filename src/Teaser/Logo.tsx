import React from "react";
import { colors, fonts } from "../shared/theme";

const dash = (p: number) => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - Math.max(0, Math.min(1, p)),
});

/**
 * Line-art mark: a lens ring holding an open book whose spine rises into a
 * single point of light (the "path" of knowledge).
 */
export const LogoMark: React.FC<{
  size: number;
  ring: number;
  book: number;
  spine: number;
  glow?: number;
}> = ({ size, ring, book, spine, glow = 0 }) => {
  const stroke = colors.turquoiseGlow;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 4.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{
        overflow: "visible",
        filter: `drop-shadow(0 0 ${6 + glow * 18}px ${colors.turquoiseGlow}${Math.round(
          0x55 + glow * 0x70,
        )
          .toString(16)
          .padStart(2, "0")})`,
      }}
    >
      <circle
        r={88}
        {...common}
        transform="rotate(-90)"
        {...dash(ring)}
      />
      <circle
        r={76}
        {...common}
        strokeWidth={1.5}
        opacity={0.45}
        transform="rotate(90)"
        {...dash(ring)}
      />
      <g transform="translate(0 16)">
        <path
          d="M 0 34 C -18 22, -40 20, -58 26 L -58 -26 C -40 -32, -18 -30, 0 -18"
          {...common}
          {...dash(book)}
        />
        <path
          d="M 0 34 C 18 22, 40 20, 58 26 L 58 -26 C 40 -32, 18 -30, 0 -18"
          {...common}
          {...dash(book)}
        />
        <path
          d="M -44 -12 C -32 -16, -18 -15, -10 -10 M -44 2 C -32 -2, -18 -1, -10 4 M 44 -12 C 32 -16, 18 -15, 10 -10 M 44 2 C 32 -2, 18 -1, 10 4"
          {...common}
          strokeWidth={2.5}
          opacity={0.7}
          {...dash(book)}
        />
        <path d="M 0 34 L 0 -52" {...common} {...dash(spine)} />
      </g>
      <circle
        cy={-46}
        r={7 * Math.min(1, Math.max(0, spine * 3 - 2))}
        fill={colors.turquoiseSoft}
      />
    </svg>
  );
};

export const Wordmark: React.FC<{
  fontSize: number;
  opacity: number;
  tracking?: number;
}> = ({ fontSize, opacity, tracking = 0 }) => (
  <div
    style={{
      fontFamily: fonts.latin,
      fontSize,
      fontWeight: 600,
      letterSpacing: `${-0.01 + tracking}em`,
      color: colors.text,
      opacity,
      direction: "ltr",
      whiteSpace: "nowrap",
    }}
  >
    Canon<span style={{ color: colors.turquoiseGlow, fontWeight: 400 }}>Medicinae</span>
  </div>
);
