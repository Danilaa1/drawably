import { Composition } from "remotion";
import { DURATION, DrawablyPromo, FPS, HEIGHT, WIDTH } from "./DrawablyPromo";
import { DrawablyForm, FORM_DURATION, FORM_FPS } from "./DrawablyForm";
import { DrawablyLine, LINE_DURATION, LINE_FPS } from "./DrawablyLine";
import { ANATOMY_DURATION, ANATOMY_FPS, DrawablyAnatomy } from "./DrawablyAnatomy";

export function RemotionRoot() {
  return (
    <>
      <Composition id="DrawablyPromo" component={DrawablyPromo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="DrawablyLine" component={DrawablyLine} durationInFrames={LINE_DURATION} fps={LINE_FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="DrawablyAnatomy" component={DrawablyAnatomy} durationInFrames={ANATOMY_DURATION} fps={ANATOMY_FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="DrawablyForm" component={DrawablyForm} durationInFrames={FORM_DURATION} fps={FORM_FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
}
