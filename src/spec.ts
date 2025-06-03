import { z } from "zod";

export type Vec3 = z.infer<typeof Vec3_Schema>;
export const Vec3_Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type SpecItem = z.infer<typeof SpecItem_Schema>;
export const SpecItem_Schema = z.union([
  z.object({
    type: z.literal("place_object"),
    object_id: z.string(),
    location_id: z.string(),
  }),
  z.object({ type: z.literal("set_environment"), id: z.string() }),
  z.object({ type: z.literal("set_temperature"), id: z.number() }),
  z.object({ type: z.literal("set_ping"), id: z.number() }),
  z.object({ type: z.literal("set_wind"), id: Vec3_Schema }),
  z.object({ type: z.literal("set_lighting"), id: z.number() }),
  z.object({ type: z.literal("add_checkpoint"), location_id: z.string() }),
  z.object({ type: z.literal("set_startpoint"), location_id: z.string() }),
  z.object({ type: z.literal("set_endpoint"), location_id: z.string() }),
]);

export type Spec = z.infer<typeof Spec_Schema>;
export const Spec_Schema = z.object({
  name: z.string(),
  description: z.string(),
  items: z.array(SpecItem_Schema),
});
