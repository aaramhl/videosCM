import React from "react";

export type IconKind = "book" | "tabs" | "pdf" | "notes";

type IconProps = { kind: IconKind; size: number; color: string; strokeWidth?: number };

/** Minimal 64×64 line-art icons. */
export const Icon: React.FC<IconProps> = ({ kind, size, color, strokeWidth = 2.6 }) => {
  const p = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible" }}>
      {kind === "book" && (
        <g {...p}>
          <path d="M14 8 H48 a4 4 0 0 1 4 4 V50 a2 2 0 0 1 -2 2 H16 a4 4 0 0 1 -4 -4 V12 a4 4 0 0 1 2 -4 Z" />
          <path d="M12 48 a4 4 0 0 1 4 -4 H52" />
          <path d="M20 8 V44" />
          <path d="M27 18 H44 M27 25 H40" />
          <path d="M16 52 V58 L20 55 L24 58 V52" />
        </g>
      )}
      {kind === "tabs" && (
        <g {...p}>
          <rect x={14} y={6} width={44} height={34} rx={4} opacity={0.55} />
          <rect x={6} y={16} width={46} height={40} rx={4} />
          <path d="M6 26 H52" />
          <path d="M8 26 V21 a3 3 0 0 1 3 -3 H22 a3 3 0 0 1 3 3 V26" />
          <path d="M27 26 V22 a3 3 0 0 1 3 -3 H38" opacity={0.6} />
          <path d="M14 36 H40 M14 43 H34 M14 50 H28" />
        </g>
      )}
      {kind === "pdf" && (
        <g {...p}>
          <path d="M16 6 H38 L50 18 V56 a2 2 0 0 1 -2 2 H16 a2 2 0 0 1 -2 -2 V8 a2 2 0 0 1 2 -2 Z" />
          <path d="M38 6 V18 H50" />
          <rect x={9} y={30} width={30} height={15} rx={3} />
          <text
            x={24}
            y={41.5}
            textAnchor="middle"
            fontFamily="'Inter Variable', sans-serif"
            fontWeight={700}
            fontSize={10}
            fill={color}
            stroke="none"
          >
            PDF
          </text>
          <path d="M22 51 H42" />
        </g>
      )}
      {kind === "notes" && (
        <g {...p}>
          <rect x={10} y={10} width={42} height={48} rx={4} />
          <path d="M19 5 V14 M29 5 V14 M39 5 V14" />
          <path d="M18 24 H44 M18 32 H44 M18 40 H36" />
          <path d="M42 50 L52 40" opacity={0.7} />
        </g>
      )}
    </svg>
  );
};
