import RAPIER from "@dimforge/rapier3d-compat";
import BasicLevel from "./level/BasicLevel";

async function main() {
  console.log("[main]");
  await RAPIER.init();
  const level = new BasicLevel();
  await level.initialize();
  level.start();
}

main();
