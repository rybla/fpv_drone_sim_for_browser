import RAPIER from "@dimforge/rapier3d-compat";
import Level from "./level/Level";
import type { Spec } from "./spec";

const example_spec: Spec = {
  name: "example",
  description: "example",
  environmentTemperature: 75,
  pingDelay: 75,
  windEnabled: false,
  lightingLevel: 1,
  checkpoint_locationIds: ["top of stairs of corner room with stairs"],
  startpoint_locationId: "base of stairs of corner room with stairs",
  endpoint_locationId: "top of stairs of corner room with stairs",
  objects: [
    {
      objectId: "barrels",
      locationId: "bottom corner of corner room with stairs",
    },
  ],
};

// const archway_chokepoint: Spec = {
//   name: "Wine Cellar Labyrinth – Archway Chokepoint WC-A3",
//   description:
//     "Inspired by the user’s scenario, this level recreates a dim, cramped wine-cellar maze whose main trial is squeezing a drone through the brick archway WC-A3. The path starts deep in the rack aisles (long bottom room), forces the pilot to line up perfectly with the choke-point archway (mapped to the “archway into light and dark room of checker corner room”), and finishes in a hidden alcove beyond (dark side of light and dark room). Leaning wine barrels and an unstable wooden divider partially block the archway, and a ventilation fan hidden in the ceiling produces short, sideways gusts. Low lighting, increased network latency, and cooler cellar air complete the challenge. Touch every checkpoint in order to succeed; brushing either the barrels or divider triggers harsh collision physics, so absolute precision is required.",
//   environmentTemperature: 58,
//   pingDelay: 90,
//   windEnabled: true,
//   lightingLevel: 0.35,
//   checkpoint_locationIds: [
//     "corner entrance of long bottom room",
//     "middle of long bottom room",
//     "archway into light and dark room of checker corner room",
//   ],
//   startpoint_locationId: "middle of long bottom room",
//   endpoint_locationId: "dark side of light and dark room",
//   objects: [
//     {
//       objectId: "barrels",
//       locationId: "archway into light and dark room of checker corner room",
//     },
//     {
//       objectId: "woodenRoomDivider",
//       locationId: "archway into light and dark room of checker corner room",
//     },
//     {
//       objectId: "fan",
//       locationId: "archway into light and dark room of checker corner room",
//     },
//     {
//       objectId: "barrels",
//       locationId: "corner entrance of long bottom room",
//     },
//     {
//       objectId: "metalBarrel",
//       locationId: "middle of long bottom room",
//     },
//     {
//       objectId: "radio",
//       locationId: "dark side of light and dark room",
//     },
//     {
//       objectId: "medicalKit",
//       locationId: "dark side of light and dark room",
//     },
//   ],
// };

// const multi_root_transit_headaches: Spec = {
//   name: "Master Suite IED Scan",
//   description:
//     "Fly a small recon-drone from the brightly lit master bathroom, skim low over a reflective marble table that scrambles the altimeter, slip through two successive doorways into an intentionally dimmer bedroom where a ceiling fan’s down-wash pushes the drone off course, and finally thread the craft into a cramped, clutter-filled dressing room. Inside the dressing room, avoid clipping a toy TU-95 model aircraft sitting on a shelf just inside the door and a wooden chair tucked beneath a low vanity while completing your scan. Signal strength drops steadily as you penetrate deeper, so hit the two interior checkpoints quickly and then exfiltrate. Battery life, changing light levels, fan-generated turbulence, and tight clearances provide continuous pressure.",
//   environmentTemperature: 68,
//   pingDelay: 80,
//   windEnabled: true,
//   lightingLevel: 0.8,
//   checkpoint_locationIds: [
//     "by window of top big light room",
//     "back of room of tight doorway room",
//   ],
//   startpoint_locationId: "middle of tile bathroom",
//   endpoint_locationId: "back of room of tight doorway room",
//   objects: [
//     {
//       objectId: "marbleTable",
//       locationId: "middle of tile bathroom",
//     },
//     {
//       objectId: "fan",
//       locationId: "by window of top big light room",
//     },
//     {
//       objectId: "tu95",
//       locationId: "by tight door of tight doorway room",
//     },
//     {
//       objectId: "woodenChair",
//       locationId: "back of room of tight doorway room",
//     },
//   ],
// };

// const spiral_staircase_verticality: Spec = {
//   name: "Grand Library Spiral Ascent",
//   description:
//     "A vertical precision-flying challenge set in the mansion’s multi-storey library. The player must guide the drone up a very tight spiral staircase that wraps around floor-to-ceiling bookshelves. Visual depth cues are distorted by the drone’s fisheye lens and the warm, low lighting. 1) Entry Challenge – a rusted metal barrel partly blocks the stairwell entrance, forcing a quick lift-over manoeuvre while remaining inside the narrow door frame. 2) Tight Confines – the inner banister and outer masonry leave only centimetres of margin; continuous roll and yaw coordination are required throughout the climb. 3) Air Currents – a ceiling ventilation fan halfway up produces intermittent upward gusts that push the drone outward, demanding constant corrective thrust. 4) Major Obstacle – three-quarters of the way up, an idle but massive portable fusion reactor has been parked on the landing, shrinking the passage to a sliver and obliging careful altitude and lateral micro-adjustments. 5) Final Obstruction – at the top, a tall wooden room divider has toppled against the rail, partly blocking the exit aperture. The drone must thread past the divider and burst through the skylight opening to clear the level. Completing all checkpoints and reaching the skylight without collision completes the mission.",
//   environmentTemperature: 68,
//   pingDelay: 75,
//   windEnabled: true,
//   lightingLevel: 0.8,
//   checkpoint_locationIds: [
//     "base of stairs of main stairway",
//     "middle flight of main stairway",
//     "top flight of main stairway",
//   ],
//   startpoint_locationId: "base of stairs of main stairway",
//   endpoint_locationId: "sky light of main stairway",
//   objects: [
//     {
//       objectId: "metalBarrel",
//       locationId: "base of stairs of main stairway",
//     },
//     {
//       objectId: "fan",
//       locationId: "middle flight of main stairway",
//     },
//     {
//       objectId: "portableFusionReactor",
//       locationId: "top flight of main stairway",
//     },
//     {
//       objectId: "woodenRoomDivider",
//       locationId: "sky light of main stairway",
//     },
//   ],
// };

// const table_navigation_issues: Spec = {
//   name: "Grand Library Table Navigation",
//   description:
//     "Navigate a tight, low-clearance space beneath a massive antique reading table in the mansion’s Grand Library. The drone starts at the doorway, slips under the table to scan intel lying beside an old floor-standing radio, then escapes—careful not to bump the radio or a half-pushed-in chair that blocks the straight exit route.",
//   environmentTemperature: 68,
//   pingDelay: 75,
//   windEnabled: false,
//   lightingLevel: 0.45,
//   checkpoint_locationIds: ["middle of long bottom room"],
//   startpoint_locationId: "corner entrance of long bottom room",
//   endpoint_locationId: "corner entrance of long bottom room",
//   objects: [
//     {
//       objectId: "woodenTable",
//       locationId: "middle of long bottom room",
//     },
//     {
//       objectId: "radio",
//       locationId: "middle of long bottom room",
//     },
//     {
//       objectId: "woodenChair",
//       locationId: "middle of long bottom room",
//     },
//   ],
// };

async function main() {
  await RAPIER.init();

  if (false) {
    const level = new Level(example_spec);
    await level.initialize();
    level.start();
  } else {
    const response = await fetch(`/specs/archway_chokepoint.json`);
    const text = await response.text();
    const spec: Spec = JSON.parse(text);

    const level = new Level(spec);
    await level.initialize();
    level.start();
  }
}

main();
