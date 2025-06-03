import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { Controls, Level } from "../common";

export function createFloor(level: Level) {
  const floorSize = 10000;
  const floorTexture = level.textureLoader.load("/floor.png");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  const textureRepeats = floorSize / 20;
  floorTexture.repeat.set(textureRepeats, textureRepeats);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
    map: floorTexture,
  });
  const floorGeometry = new THREE.BoxGeometry(floorSize, 0.2, floorSize);
  floorGeometry.computeVertexNormals();
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  level.scene.add(floor);
  level.world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      floorSize / 2,
      0.1,
      floorSize / 2,
    ).setTranslation(0, -0.1, 0),
  );
}
