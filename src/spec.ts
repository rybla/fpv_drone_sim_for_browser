import { z } from "zod";

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
      "The lighting intensity level. All light intensities are multiplied by this, so 0 is completely dark and 1 is normal instensity.",
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
