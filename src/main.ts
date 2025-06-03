import RAPIER from "@dimforge/rapier3d-compat";
import Level from "./level/Level";

async function main() {
  await RAPIER.init();
  const level = new Level();
  await level.initialize();
  level.start();
}

main();
