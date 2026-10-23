import cycling from "@/assets/ex-cycling.jpg";
import chestPress from "@/assets/ex-chestpress.jpg";
import pullOver from "@/assets/ex-pullover.jpg";
import pecFly from "@/assets/ex-pecfly.jpg";
import overheadExt from "@/assets/ex-overheadext.jpg";
import pushDown from "@/assets/ex-pushdown.jpg";
import catCow from "@/assets/ex-catcow.jpg";
import hipFlexor from "@/assets/ex-hipflexor.jpg";
import wallAngels from "@/assets/ex-wallangels.jpg";
import birdDog from "@/assets/ex-birddog.jpg";
import deadHang from "@/assets/ex-deadhang.jpg";
import chinTucks from "@/assets/ex-chintucks.jpg";
import chinUp from "@/assets/ex-chinup.jpg";
import latPullDown from "@/assets/ex-latpulldown.jpg";
import seatedRow from "@/assets/ex-seatedrow.jpg";
import curl from "@/assets/ex-curl.jpg";
import hammerCurl from "@/assets/ex-hammercurl.jpg";
import shoulderPress from "@/assets/ex-shoulderpress.jpg";
import frontRaise from "@/assets/ex-frontraise.jpg";
import squat from "@/assets/ex-squat.jpg";
import legPress from "@/assets/ex-legpress.jpg";
import legCurl from "@/assets/ex-legcurl.jpg";

export type AnimKey = "cycling" | "chestPress" | "pullOver" | "pecFly" | "overheadExt" | "pushDown" | "catCow" | "hipFlexor" | "wallAngels" | "birdDog" | "deadHang" | "chinTucks" | "chinUp" | "latPullDown" | "seatedRow" | "curl" | "hammerCurl" | "shoulderPress" | "frontRaise" | "squat" | "legPress" | "legCurl";

// Each image is a 2-panel sprite: left = start pose, right = end pose.
const SRC: Record<AnimKey, string> = { cycling, chestPress, pullOver, pecFly, overheadExt, pushDown, catCow, hipFlexor, wallAngels, birdDog, deadHang, chinTucks, chinUp, latPullDown, seatedRow, curl, hammerCurl, shoulderPress, frontRaise, squat, legPress, legCurl };
const SLOW: AnimKey[] = ["catCow", "hipFlexor", "wallAngels", "birdDog", "deadHang", "chinTucks"];

// These photos came back as one pose repeated in both panels, so a crossfade would
// look frozen. Show a single pose and let the frame drift instead.
const HOLD: AnimKey[] = ["hipFlexor", "deadHang", "chinTucks"];

export function ExerciseAnimation({ kind }: { kind: AnimKey }) {
  const src = SRC[kind];
  const speed = kind === "cycling" ? "0.9s" : SLOW.includes(kind) ? "3.2s" : "2.4s";

  if (HOLD.includes(kind)) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <div
          className="ex-hold absolute inset-0 bg-cover bg-left"
          style={{ backgroundImage: `url(${src})`, backgroundSize: "200% 100%" }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-cover bg-left" style={{ backgroundImage: `url(${src})`, backgroundSize: "200% 100%" }} />
      <div
        className="ex-frame absolute inset-0 bg-cover bg-right"
        style={{ backgroundImage: `url(${src})`, backgroundSize: "200% 100%", animationDuration: speed }}
      />
    </div>
  );
}
