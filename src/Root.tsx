import "./index.css";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { ElafReel, FPS, REEL_DURATION } from "./ElafReel";
import { ElafReel3D, REEL3D_DURATION } from "./ElafReel3D";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 3D motion-graphic version, 15s including the logo outro — npm run render:elaf3d */}
      <Composition
        id="ElafReel3D"
        component={ElafReel3D}
        durationInFrames={REEL3D_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      {/* Instagram Reel for baby Elaf's favors — npm run render:elaf */}
      <Composition
        id="ElafReel"
        component={ElafReel}
        durationInFrames={REEL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          logoColor1: "#91dAE2",
          logoColor2: "#86A8E7",
        }}
      />
    </>
  );
};
