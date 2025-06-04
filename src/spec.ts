import { z } from "zod";

export type LocationId = z.infer<typeof LocationId_Schema>;
export const LocationId_Schema = z
  .enum([
    "on top of the table in room A",
    "under the table in room A",
    "in the middle of room A",
    "in the middle of room B",
    "near the wall of room B",
    "by the window in room B",
    "in the doorway between rooms A and B",
    // TODO: more
  ])
  .describe("A specific location in the level.");

export type ObjectId = z.infer<typeof ObjectId_Schema>;
export const ObjectId_Schema = z
  .enum([
    "lamp",
    "ball",
    "obstacle course ring",
    "flashlight",
    "fan",
    "easle",
    "TV",
    "airplane",
    "sofa",
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
