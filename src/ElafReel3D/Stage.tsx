import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
// CSS perspective distance: how strongly depth shrinks with distance.
export const PERSPECTIVE = 1600;

// Camera looking at a point (cx, cy) on the tabletop, in cutout-source pixels.
export type Camera = {
  readonly cx: number;
  readonly cy: number;
  // Base scale from source pixels to screen pixels.
  readonly s: number;
  // Dolly toward (+) or away from (-) the table, in screen pixels.
  readonly dolly: number;
  // Tilt of the table away from the camera, degrees (0 = straight top-down).
  readonly tilt: number;
  // Rotation of the table around the view axis, degrees.
  readonly yaw: number;
};

export type Key<T> = { readonly f: number } & T;

const ease = Easing.bezier(0.45, 0, 0.55, 1);

export function animate<T extends Record<string, number>>(
  frame: number,
  keys: readonly Key<T>[],
): T {
  const out: Record<string, number> = {};
  for (const name of Object.keys(keys[0])) {
    if (name === "f") continue;
    out[name] =
      keys.length === 1
        ? keys[0][name]
        : interpolate(
            frame,
            keys.map((k) => k.f),
            keys.map((k) => k[name]),
            {
              easing: ease,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
  }
  return out as T;
}

const rad = (d: number) => (d * Math.PI) / 180;

// Where a point on the tabletop lands on screen — mirrors the CSS transform
// chain in <Stage>, so focus effects can follow objects through the camera.
export const project = (cam: Camera, x: number, y: number) => {
  let px = (x - cam.cx) * cam.s;
  let py = (y - cam.cy) * cam.s;
  const cz = Math.cos(rad(cam.yaw));
  const sz = Math.sin(rad(cam.yaw));
  [px, py] = [px * cz - py * sz, px * sz + py * cz];
  const pz = py * Math.sin(rad(cam.tilt)) + cam.dolly;
  py = py * Math.cos(rad(cam.tilt));
  const k = PERSPECTIVE / (PERSPECTIVE - pz);
  return { x: W / 2 + px * k, y: H / 2 + py * k };
};

export type Piece = {
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  // Height above the table, in source pixels.
  readonly z?: number;
  readonly rot?: number;
  readonly tiltX?: number;
  readonly tiltY?: number;
};

// Soft window light from the upper left: shadows fall down and to the right.
const LIGHT = { x: 0.55, y: 0.8 };

const PieceLayer: React.FC<{
  readonly piece: Piece;
  readonly grade: string;
}> = ({ piece, grade }) => {
  const z = piece.z ?? 0;
  const base: React.CSSProperties = {
    position: "absolute",
    left: piece.x,
    top: piece.y,
    width: piece.w,
    height: piece.h,
    maxWidth: "none",
    transformOrigin: "50% 50%",
  };
  const rot = `rotateZ(${piece.rot ?? 0}deg)`;
  const src = staticFile(piece.src);
  return (
    <>
      {/* Contact shadow, hugging the paper edge. */}
      <Img
        src={src}
        style={{
          ...base,
          transform: `translate3d(${2 + z * 0.1}px, ${3 + z * 0.15}px, 0.2px) ${rot}`,
          filter: `brightness(0) blur(${3 + z * 0.08}px)`,
          opacity: 0.22 * Math.max(0.35, 1 - z / 120),
        }}
      />
      {/* Cast shadow, drifting away and softening as the piece lifts. */}
      <Img
        src={src}
        style={{
          ...base,
          transform: `translate3d(${10 + z * LIGHT.x}px, ${16 + z * LIGHT.y}px, 0.1px) ${rot}`,
          filter: `brightness(0) blur(${16 + z * 0.35}px)`,
          opacity: 0.2,
        }}
      />
      <Img
        src={src}
        style={{
          ...base,
          transform: `translate3d(0, 0, ${z + 1}px) ${rot} rotateX(${piece.tiltX ?? 0}deg) rotateY(${piece.tiltY ?? 0}deg)`,
          filter: grade,
        }}
      />
    </>
  );
};

const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.55 0'/></filter><rect width='300' height='300' filter='url(#n)'/></svg>",
)}")`;

// The tabletop and every product piece on it, seen through `cam`.
export const Stage: React.FC<{
  readonly cam: Camera;
  readonly pieces: readonly Piece[];
  readonly grade: string;
}> = ({ cam, pieces, grade }) => {
  const world = `translate3d(${W / 2}px, ${H / 2}px, ${cam.dolly}px) rotateX(${cam.tilt}deg) rotateZ(${cam.yaw}deg) scale3d(${cam.s}, ${cam.s}, ${cam.s}) translate3d(${-cam.cx}px, ${-cam.cy}px, 0)`;
  return (
    <AbsoluteFill
      style={{
        perspective: PERSPECTIVE,
        perspectiveOrigin: `${W / 2}px ${H / 2}px`,
        overflow: "hidden",
        backgroundColor: "#E4DBCA",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformStyle: "preserve-3d",
          transformOrigin: "0 0",
          transform: world,
        }}
      >
        {/* Cream tabletop with a faint paper grain. */}
        <div
          style={{
            position: "absolute",
            left: cam.cx - 4000,
            top: cam.cy - 4000,
            width: 8000,
            height: 8000,
            backgroundColor: "#E9E1D1",
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,250,240,0.55), rgba(255,250,240,0) 22%), ${NOISE}`,
            backgroundSize: "100% 100%, 300px 300px",
            opacity: 1,
          }}
        />
        {pieces.map((p) => (
          <PieceLayer key={p.src} piece={p} grade={grade} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
