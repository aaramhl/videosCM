import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { animate, Camera, H, Key, Piece, project, Stage, W } from "./Stage";

export const FPS = 30;
const XFADE = 18;
const SCENE = 78;
const OUTRO_FROM = 5 * SCENE;
export const REEL3D_DURATION = 15 * FPS;

// Cutouts from the top-down photo, at their photographed positions.
const SET: readonly Piece[] = [
  { src: "cutouts/package.png", x: 47, y: 500, w: 604, h: 464 },
  { src: "cutouts/bow.png", x: 669, y: 739, w: 174, h: 174 },
  { src: "cutouts/card-right.png", x: 871, y: 771, w: 329, h: 482 },
  { src: "cutouts/stickers.png", x: 53, y: 965, w: 140, h: 127 },
  { src: "cutouts/set-front.png", x: 223, y: 996, w: 590, h: 456 },
];
const SET_GRADE = "brightness(1.1) saturate(0.96)";

// The adhkar card and main favor from the close-up photo.
const HERO: readonly Piece[] = [
  { src: "cutouts/hero.png", x: 6, y: 749, w: 1430, h: 1242 },
];
const HERO_GRADE = "brightness(1.06) saturate(0.96) sepia(0.04)";
const BOW = { x: 1095, y: 1035 };
const FAVOR = { x: 1090, y: 1330 };
const NAME = { x: 270, y: 885 };

type Focus = { readonly x: number; readonly y: number };

type Scene = {
  readonly pieces: (frame: number) => readonly Piece[];
  readonly grade: string;
  readonly camera: readonly Key<Camera>[];
  // Point on the table kept sharp; everything else falls off into blur.
  readonly focus?: readonly Key<Focus>[];
  readonly focusRadius?: number;
  readonly blur?: number;
  readonly haze?: boolean;
};

const L = SCENE + XFADE;

// Pieces drift down onto the table one after another.
const settling = (frame: number): readonly Piece[] =>
  SET.map((p, i) => {
    const t = interpolate(frame, [i * 5, i * 5 + 55], [0, 1], {
      easing: Easing.bezier(0.2, 0, 0.1, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return {
      ...p,
      z: (1 - t) * 70,
      rot: (1 - t) * (i % 2 ? 2.5 : -2.5),
      tiltX: (1 - t) * 6,
    };
  });

const SCENES: readonly Scene[] = [
  // 1 — Macro on the bow and floral paper, gliding in low over the table.
  {
    pieces: () => HERO,
    grade: HERO_GRADE,
    camera: [
      {
        f: 0,
        cx: BOW.x + 30,
        cy: BOW.y + 10,
        s: 1,
        dolly: 640,
        tilt: 42,
        yaw: -9,
      },
      { f: L, cx: BOW.x, cy: BOW.y + 90, s: 1, dolly: 760, tilt: 32, yaw: -4 },
    ],
    focus: [
      { f: 0, ...BOW },
      { f: L, x: BOW.x, y: BOW.y + 70 },
    ],
    focusRadius: 0.75,
    blur: 6,
  },
  // 2 — Top-down on the full set as the pieces settle onto the table.
  {
    pieces: settling,
    grade: SET_GRADE,
    camera: [
      { f: 0, cx: 610, cy: 960, s: 0.9, dolly: 60, tilt: 12, yaw: -5 },
      { f: L, cx: 640, cy: 985, s: 0.9, dolly: 0, tilt: 4, yaw: 1.5 },
    ],
  },
  // 3 — Slow push toward the main favor, with a soft dreamy haze.
  {
    pieces: () => HERO,
    grade: HERO_GRADE,
    camera: [
      { f: 0, cx: 1000, cy: 1340, s: 0.8, dolly: 150, tilt: 24, yaw: 4 },
      {
        f: L,
        cx: FAVOR.x,
        cy: FAVOR.y - 40,
        s: 0.8,
        dolly: 720,
        tilt: 12,
        yaw: 0,
      },
    ],
    focus: [{ f: 0, ...FAVOR }],
    focusRadius: 0.75,
    blur: 7,
    haze: true,
  },
  // 4 — Low angle across the card; focus racks from the favor to "إيلاف".
  {
    pieces: () => HERO,
    grade: HERO_GRADE,
    camera: [
      { f: 0, cx: 820, cy: 1150, s: 1, dolly: 360, tilt: 38, yaw: -10 },
      { f: L, cx: 400, cy: 1000, s: 1, dolly: 500, tilt: 34, yaw: -5 },
    ],
    focus: [
      { f: 0, ...FAVOR },
      { f: 20, ...FAVOR },
      { f: 66, ...NAME },
    ],
    focusRadius: 0.55,
    blur: 8,
  },
  // 5 — Pull back and rise to top-down: the whole set, centred in open space.
  {
    pieces: () => SET,
    grade: SET_GRADE,
    camera: [
      { f: 0, cx: 600, cy: 1000, s: 0.85, dolly: 420, tilt: 26, yaw: 6 },
      { f: L, cx: 623, cy: 976, s: 0.85, dolly: -280, tilt: 3, yaw: 0 },
    ],
  },
];

const SceneLayer: React.FC<{
  readonly scene: Scene;
  readonly duration: number;
  readonly first: boolean;
  readonly last: boolean;
}> = ({ scene, duration, first, last }) => {
  const frame = useCurrentFrame();
  const cam = animate(frame, scene.camera);
  const pieces = scene.pieces(frame);
  const opacity = Math.min(
    first
      ? 1
      : interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: "clamp" }),
    last
      ? 1
      : interpolate(frame, [duration - XFADE, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
  );

  let blurred: React.ReactNode = null;
  if (scene.focus) {
    const f = animate(frame, scene.focus);
    const p = project(cam, f.x, f.y);
    const r = W * (scene.focusRadius ?? 0.5);
    const mask = `radial-gradient(ellipse ${r}px ${r * 1.2}px at ${p.x}px ${p.y}px, transparent 0%, transparent 42%, rgba(0,0,0,0.75) 78%, black 100%)`;
    blurred = (
      <AbsoluteFill
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          filter: `blur(${scene.blur ?? 8}px)`,
        }}
      >
        <Stage cam={cam} pieces={pieces} grade={scene.grade} />
      </AbsoluteFill>
    );
  }

  const haze = scene.haze
    ? interpolate(frame, [0, 40, L], [0, 0.55, 0.75], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill style={{ opacity }}>
      <Stage cam={cam} pieces={pieces} grade={scene.grade} />
      {blurred}
      {haze > 0 ? (
        <AbsoluteFill
          style={{
            opacity: haze,
            mixBlendMode: "screen",
            background:
              "radial-gradient(ellipse 60% 40% at 38% 30%, rgba(255,236,226,0.45), rgba(255,236,226,0) 70%)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const WindowLight: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, REEL3D_DURATION], [-6, 8]);
  return (
    <>
      {/* A broad, soft beam of daylight falling diagonally across the table. */}
      <AbsoluteFill
        style={{
          mixBlendMode: "soft-light",
          background: `linear-gradient(118deg, rgba(255,246,228,0) ${18 + shift}%, rgba(255,246,228,0.5) ${34 + shift}%, rgba(255,246,228,0.5) ${50 + shift}%, rgba(255,246,228,0) ${68 + shift}%)`,
        }}
      />
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(ellipse 90% 55% at 12% 4%, rgba(255,240,218,0.32), rgba(255,240,218,0) 70%)",
        }}
      />
      <AbsoluteFill
        style={{
          mixBlendMode: "multiply",
          background:
            "radial-gradient(ellipse 85% 75% at 50% 48%, rgba(0,0,0,0) 58%, rgba(120,88,70,0.18) 100%)",
        }}
      />
    </>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const length = REEL3D_DURATION - OUTRO_FROM + XFADE / 2;
  const bg = interpolate(frame, [0, XFADE], [0, 1], {
    extrapolateRight: "clamp",
  });
  const t = interpolate(frame, [XFADE - 6, XFADE + 30], [0, 1], {
    easing: Easing.bezier(0.25, 0, 0.1, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frame, [XFADE, length], [0, 1], {
    extrapolateLeft: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, #D6B0B1 0%, #C4969A 55%, #A87D82 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          perspective: 1400,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 960,
            opacity: t,
            transform: `translateZ(${(1 - t) * -260 + drift * 30}px) rotateY(${(1 - t) * -28 + drift * 4}deg) rotateX(${(1 - t) * 10}deg)`,
            filter: `blur(${(1 - t) * 5}px) drop-shadow(${14 - drift * 4}px 20px 26px rgba(105,64,72,0.34))`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ElafReel3D: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E9E1D1", width: W, height: H }}>
      {SCENES.map((scene, i) => {
        const last = i === SCENES.length - 1;
        const from = i === 0 ? 0 : i * SCENE - XFADE / 2;
        const duration = i === 0 ? L - XFADE / 2 : last ? L + XFADE : L;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <SceneLayer
              scene={scene}
              duration={duration}
              first={i === 0}
              last={last}
            />
          </Sequence>
        );
      })}
      <WindowLight />
      <Sequence from={OUTRO_FROM - XFADE / 2}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
