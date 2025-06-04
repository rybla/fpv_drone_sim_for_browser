import RAPIER from "@dimforge/rapier3d-compat";
import Level from "./level/Level";
import type { Spec } from "./spec";

async function main() {
  await RAPIER.init();
  const spec: Spec = {
    name: "",
    description: "",
    environmentId: "",
    environmentTemperature: 75,
    pingDelay: Math.random() * 50 + 50,
    windEnabled: false,
    lightingLevel: 0,
    checkpoint_locationIds: [],
    startpoint_locationId: "",
    endpoint_locationId: "",
    objects: [],
  };
  const level = new Level(spec);
  await level.initialize();
  level.start();
}

main();
