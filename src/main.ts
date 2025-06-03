import BasicLevel from "./level/BasicLevel";

async function main() {
  const level = new BasicLevel();
  await level.initialize();
  level.start();
}

main();
