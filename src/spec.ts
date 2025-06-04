import { z } from "zod";
import * as THREE from "three";

const locations = {
  "bottom corner of corner room with stairs": new THREE.Vector3(-3.4, 1.0, 0.1),
  "base of stairs of corner room with stairs": new THREE.Vector3(
    17.0,
    1.2,
    -9.2,
  ),
  "middle flight of corner room with stairs": new THREE.Vector3(
    10.1,
    13.0,
    -27.9,
  ),
  "top of stairs of corner room with stairs": new THREE.Vector3(
    0.2,
    19.1,
    -3.4,
  ),
  "corner entrance of long bottom room": new THREE.Vector3(26.6, 1.0, -6.7),
  "middle of long bottom room": new THREE.Vector3(35.8, 7.2, -15.3),
  "facing archway door of small corner room": new THREE.Vector3(
    74.7,
    3.7,
    -1.3,
  ),
  "dark side of light and dark room": new THREE.Vector3(51.5, 32, -22.7),
  "light side of light and dark room": new THREE.Vector3(83.4, 2.5, -21.8),
  "in corner of checker corner room": new THREE.Vector3(78.1, 3.0, -52.0),
  "archway into light and dark room of checker corner room": new THREE.Vector3(
    74.9,
    2.1,
    -38.2,
  ),
  "base of stairs of main stairway": new THREE.Vector3(49.7, 1.7, -39.1),
  "middle flight of main stairway": new THREE.Vector3(28.2, 10.6, -33.9),
  "top flight of main stairway": new THREE.Vector3(47.5, 22.0, -30.7),
  "sky light of main stairway": new THREE.Vector3(40.2, 2.3, -34.8),
  "middle of small boring room": new THREE.Vector3(53.0, 4.2, -51.3),
  "middle of tile bathroom": new THREE.Vector3(31.9, 10.7, -53.1),
  "middle of top boring room": new THREE.Vector3(50.7, 21.8, -51.8),
  "corner of top light room": new THREE.Vector3(80.5, 19.9, -56.4),
  "doorway of top light room": new THREE.Vector3(66.1, 18.8, -42.2),
  "by stairs of top hallway": new THREE.Vector3(58.7, 18.5, -36.1),
  "by narrow door room of top hallway": new THREE.Vector3(58.9, 18.4, -4.1),
  "middle of hallway of top hallway": new THREE.Vector3(37.1, 19.7, -2.3),
  "by window of top big light room": new THREE.Vector3(85.6, 18.1, -22.4),
  "by door of top big light room": new THREE.Vector3(65.8, 19.7, -23.9),
  "back of room of tight doorway room": new THREE.Vector3(74.9, 17.0, -3.3),
  "by tight door of tight doorway room": new THREE.Vector3(65.3, 20.9, -7.5),
};

export type LocationId = z.infer<typeof LocationId_Schema>;
export const LocationId_Schema = z
  .enum([
    "bottom corner of corner room with stairs",
    "base of stairs of corner room with stairs",
    "middle flight of corner room with stairs",
    "top of stairs of corner room with stairs",
    "corner entrance of long bottom room",
    "middle of long bottom room",
    "facing archway door of small corner room",
    "dark side of light and dark room",
    "light side of light and dark room",
    "in corner of checker corner room",
    "archway into light and dark room of checker corner room",
    "base of stairs of main stairway",
    "middle flight of main stairway",
    "top flight of main stairway",
    "sky light of main stairway",
    "middle of small boring room",
    "middle of tile bathroom",
    "middle of top boring room",
    "corner of top light room",
    "doorway of top light room",
    "by stairs of top hallway",
    "by narrow door room of top hallway",
    "middle of hallway of top hallway",
    "by window of top big light room",
    "by door of top big light room",
    "back of room of tight doorway room",
    "by tight door of tight doorway room",
  ])
  .describe("A specific location in the level.");

export type ObjectId = z.infer<typeof ObjectId_Schema>;
export const ObjectId_Schema = z
  .enum([
    "barrels",
    "barrier",
    "coffeeTable",
    "dynamite",
    "fan",
    "grenadeCrate",
    "mansion",
    "marbleTable",
    "medicalKit",
    "metalBarrel",
    "portableFusionReactor",
    "radio",
    "tank",
    "tu95",
    "woodenChair",
    "woodenRoomDivider",
    "woodenTable",
  ])
  .describe("An object that can be placed in the level.");

export type Spec = z.infer<typeof Spec_Schema>;
export const Spec_Schema = z.object({
  name: z.string().describe("A short name for the level specification."),
  description: z
    .string()
    .describe(
      "A longer description of what the inspiration for the level was and many details about the level.",
    ),
  environmentTemperature: z
    .number()
    .describe(
      "The environment's temperature, in Fahrenheit. The default temperature should be 70F.",
    ),
  pingDelay: z
    .number()
    .describe(
      "The delay between pings, in milliseconds. The default ping should be 75ms.",
    ),
  windEnabled: z
    .boolean()
    .describe("Whether wind is enabled. By default, there should be no wind."),
  lightingLevel: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "The lighting intensity level. All light intensities are multiplied by this.",
    ),
  checkpoint_locationIds: z
    .array(LocationId_Schema)
    .describe(
      "The locations at which to put checkpoints. The player must touch each checkpoint in order to complete the level.",
    ),
  startpoint_locationId: LocationId_Schema.describe(
    "The player's starting point.",
  ),
  endpoint_locationId: LocationId_Schema.describe(
    "The player's target endpoint they need to get to in order to complete the level.",
  ),
  objects: z
    .array(
      z
        .object({
          objectId: ObjectId_Schema.describe("The object to place."),
          locationId: LocationId_Schema.describe(
            "The location where the place the object.",
          ),
        })
        .describe("An object and it's placement in the level."),
    )
    .describe("The objects in the level."),
});
