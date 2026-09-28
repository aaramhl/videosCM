import "@fontsource-variable/cairo";
import "@fontsource-variable/inter";
import { continueRender, delayRender } from "remotion";

// Arabic and Latin subsets are split by unicode-range, so request both
// explicitly before the first frame is captured.
const handle = delayRender("Loading Cairo and Inter");
Promise.all([
  document.fonts.load("400 40px 'Cairo Variable'", "المعرفة"),
  document.fonts.load("700 40px 'Cairo Variable'", "المعرفة ٠١"),
  document.fonts.load("400 40px 'Inter Variable'", "Canon"),
  document.fonts.load("600 40px 'Inter Variable'", "Canon"),
])
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });
