import { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type Level from "../level/Level";

// TODO: make `i` actually an arguemnt `pos: THREE.Vector3` that sets the position
export function createBarrier(level: Level, i: number) {
  const militaryMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a2a,
    roughness: 0.9,
    metalness: 0.1,
  });

  const barrierMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2, 0.5),
    militaryMaterial,
  );
  barrierMesh.castShadow = true;
  barrierMesh.receiveShadow = true;
  barrierMesh.position.set(5 + i * 5, 1, 8);
  level.scene.add(barrierMesh);
  const barrierCol = level.world.createCollider(
    ColliderDesc.cuboid(2, 1, 0.25).setTranslation(5 + i * 5, 1, 8),
  );

  return { mesh: barrierMesh, collider: barrierCol };
}
