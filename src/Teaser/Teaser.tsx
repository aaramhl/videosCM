import "./fonts";
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Background } from "./Background";
import { SceneIntro } from "./SceneIntro";
import { SceneLens } from "./SceneLens";
import { SceneOutro } from "./SceneOutro";
import { ScenePath } from "./ScenePath";
import { colors, DURATION } from "./theme";

// Scenes share one global timeline so hand-offs can overlap precisely.
export const Teaser: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [DURATION - 22, DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy900 }}>
      <Background />
      {frame < 70 && <SceneIntro />}
      {frame >= 54 && frame < 262 && <ScenePath />}
      {frame >= 236 && frame < 358 && <SceneLens />}
      {frame >= 348 && <SceneOutro />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: 1 - fadeOut }} />
      <Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
};
