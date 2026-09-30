import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A camera keyframe, in source-image pixels: the view is centred on (cx, cy)
// and shows `w` source pixels across the frame width.
export type CameraKey = {
  readonly f: number;
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
};

// A focus keyframe, in source-image pixels. Everything outside the focus
// ellipse falls off into a soft blur to fake a shallow depth of field.
export type FocusKey = {
  readonly f: number;
  readonly x: number;
  readonly y: number;
};

const ease = Easing.bezier(0.45, 0, 0.55, 1);

const track = (
  frame: number,
  keys: readonly { f: number }[],
  pick: (k: never) => number,
) => {
  const frames = keys.map((k) => k.f);
  const values = keys.map((k) => pick(k as never));
  if (keys.length === 1) return values[0];
  return interpolate(frame, frames, values, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const KenBurns: React.FC<{
  readonly src: string;
  readonly imgW: number;
  readonly imgH: number;
  readonly camera: readonly CameraKey[];
  readonly focus?: readonly FocusKey[];
  // Radius of the sharp zone, as a fraction of the frame width.
  readonly focusRadius?: number;
  readonly blur?: number;
  readonly bloom?: number;
}> = ({
  src,
  imgW,
  imgH,
  camera,
  focus,
  focusRadius = 0.45,
  blur = 7,
  bloom = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const w = track(frame, camera, (k: CameraKey) => k.w);
  const scale = width / w;
  const viewH = height / scale;
  // Keep the view inside the photo so no empty edges ever show.
  const clamp = (v: number, half: number, max: number) =>
    Math.min(Math.max(v, half), max - half);
  const cx = clamp(
    track(frame, camera, (k: CameraKey) => k.cx),
    w / 2,
    imgW,
  );
  const cy = clamp(
    track(frame, camera, (k: CameraKey) => k.cy),
    viewH / 2,
    imgH,
  );

  const left = width / 2 - cx * scale;
  const top = height / 2 - cy * scale;

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width: imgW * scale,
    height: imgH * scale,
    maxWidth: "none",
    filter: "saturate(0.94) sepia(0.05) brightness(1.02)",
  };

  let mask: string | undefined;
  if (focus) {
    const fx = track(frame, focus, (k: FocusKey) => k.x) * scale + left;
    const fy = track(frame, focus, (k: FocusKey) => k.y) * scale + top;
    const r = width * focusRadius;
    mask = `radial-gradient(ellipse ${r}px ${r * 1.15}px at ${fx}px ${fy}px, transparent 0%, transparent 45%, rgba(0,0,0,0.7) 80%, black 100%)`;
  }

  const image = staticFile(src);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#F4EEE3" }}>
      <Img src={image} style={imgStyle} />
      {focus ? (
        <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <Img
            src={image}
            style={{
              ...imgStyle,
              filter: `${imgStyle.filter} blur(${blur}px)`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {bloom > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: bloom }}>
          <Img
            src={image}
            style={{
              ...imgStyle,
              filter: `${imgStyle.filter} blur(22px) brightness(1.05)`,
            }}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
