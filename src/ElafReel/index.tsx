import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraKey, FocusKey, KenBurns } from "./KenBurns";

export const FPS = 30;
// Cross-dissolve length between scenes; slow on purpose.
const XFADE = 18;
const SCENE = 3 * FPS;
const OUTRO = Math.round(2.5 * FPS);
export const REEL_DURATION = 5 * SCENE + OUTRO;

const CLOSEUP = { src: "favors-closeup.jpg", imgW: 1500, imgH: 2000 } as const;
const FLATLAY = { src: "favors-flatlay.jpg", imgW: 1200, imgH: 1600 } as const;

type Scene = {
  readonly photo: typeof CLOSEUP | typeof FLATLAY;
  readonly camera: readonly CameraKey[];
  readonly focus?: readonly FocusKey[];
  readonly focusRadius?: number;
  readonly blur?: number;
  readonly bloom?: boolean;
};

// Local frame 0 is XFADE/2 before the scene's nominal start.
const L = SCENE + XFADE;

const SCENES: readonly Scene[] = [
  // 1 — Soft close-up of the floral paper and the pink bow.
  {
    photo: CLOSEUP,
    camera: [
      { f: 0, cx: 1130, cy: 1010, w: 560 },
      { f: L, cx: 1100, cy: 1130, w: 660 },
    ],
    focus: [
      { f: 0, x: 1110, y: 1060 },
      { f: L, x: 1110, y: 1120 },
    ],
    focusRadius: 0.55,
    blur: 6,
  },
  // 2 — Top-down view of the complete set, floating across the table.
  {
    photo: FLATLAY,
    camera: [
      { f: 0, cx: 420, cy: 960, w: 800 },
      { f: L, cx: 780, cy: 960, w: 760 },
    ],
  },
  // 3 — Push toward the main favor: bow, florals and calligraphy.
  {
    photo: CLOSEUP,
    camera: [
      { f: 0, cx: 1000, cy: 1180, w: 1125 },
      { f: L, cx: 1080, cy: 1220, w: 700 },
    ],
    focus: [{ f: 0, x: 1100, y: 1220 }],
    focusRadius: 0.7,
    blur: 5,
    bloom: true,
  },
  // 4 — Rack focus from the packaging to the name "إيلاف".
  {
    photo: CLOSEUP,
    camera: [
      { f: 0, cx: 700, cy: 1080, w: 1080 },
      { f: L, cx: 470, cy: 1000, w: 900 },
    ],
    focus: [
      { f: 0, x: 1100, y: 1150 },
      { f: 22, x: 1100, y: 1150 },
      { f: 70, x: 290, y: 880 },
    ],
    focusRadius: 0.5,
    blur: 8,
  },
  // 5 — The complete arrangement, centred, with a slow pull-back.
  {
    photo: FLATLAY,
    camera: [
      { f: 0, cx: 620, cy: 1000, w: 640 },
      { f: L, cx: 600, cy: 800, w: 900 },
    ],
  },
];

const WarmLight: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Window light drifting very slowly across the frame.
  const x = interpolate(frame, [0, durationInFrames], [12, 30]);
  const y = interpolate(frame, [0, durationInFrames], [4, 10]);
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 60% at ${x}% ${y}%, rgba(255,241,220,0.30), rgba(255,241,220,0) 70%)`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 48%, rgba(0,0,0,0) 60%, rgba(120,88,70,0.16) 100%)",
          mixBlendMode: "multiply",
        }}
      />
    </>
  );
};

const SceneLayer: React.FC<{
  readonly scene: Scene;
  readonly duration: number;
  readonly first: boolean;
  readonly last: boolean;
}> = ({ scene, duration, first, last }) => {
  const frame = useCurrentFrame();
  const fadeIn = first ? 12 : XFADE;
  const opacity = Math.min(
    interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" }),
    last ? 1 : interpolate(frame, [duration - XFADE, duration], [1, 0], { extrapolateLeft: "clamp" }),
  );
  const bloom = scene.bloom
    ? interpolate(frame, [0, 40, L], [0, 0.2, 0.28], { extrapolateRight: "clamp" })
    : 0;
  return (
    <AbsoluteFill style={{ opacity }}>
      <KenBurns
        {...scene.photo}
        camera={scene.camera}
        focus={scene.focus}
        focusRadius={scene.focusRadius}
        blur={scene.blur}
        bloom={bloom}
      />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: "clamp" });
  const logoIn = interpolate(frame, [XFADE - 4, XFADE + fps], [0, 1], {
    easing: Easing.bezier(0.33, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [XFADE - 4, OUTRO + XFADE], [0.94, 1.02], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, #D4ADAF 0%, #C39498 55%, #A97E83 100%)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Img
          src={staticFile("logo.png")}
          style={{
            width: 960,
            opacity: logoIn,
            transform: `scale(${scale})`,
            filter: `blur(${(1 - logoIn) * 6}px) drop-shadow(0 6px 22px rgba(110,70,76,0.28))`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ElafReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#F4EEE3" }}>
      {SCENES.map((scene, i) => {
        const from = i === 0 ? 0 : i * SCENE - XFADE / 2;
        const last = i === SCENES.length - 1;
        // The last scene stays underneath the outro while it dissolves in.
        const duration = i === 0 ? L - XFADE / 2 : last ? L + XFADE : L;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <SceneLayer scene={scene} duration={duration} first={i === 0} last={last} />
          </Sequence>
        );
      })}
      <WarmLight />
      <Sequence from={5 * SCENE - XFADE / 2}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
