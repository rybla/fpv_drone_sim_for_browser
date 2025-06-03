import { z } from "zod";

export type Vec3 = z.infer<typeof Vec3_Schema>;
export const Vec3_Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type Spec = z.infer<typeof Spec_Schema>;
export const Spec_Schema = z.object({
  name: z.string(),
  description: z.string(),
  environmentId: z.string(),
  environmentTemperature: z.number(),
  pingDelay: z.number(),
  windEnabled: z.boolean(),
  lightingLevel: z
    .number()
    .min(0)
    .max(1)
    .describe("All light intensities are multiplied by this."),
  checkpoint_locationIds: z.array(z.string()),
  startpoint_locationId: z.string(),
  endpoint_locationId: z.string(),
  objects: z.array(
    z.object({
      objectId: z.string(),
      locationId: z.string(),
    }),
  ),
});
