import "./index.css";
import { Composition } from "remotion";
import { Teaser } from "./Teaser/Teaser";
import { DURATION, FPS, HEIGHT, WIDTH } from "./Teaser/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CanonTeaser"
      component={Teaser}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
