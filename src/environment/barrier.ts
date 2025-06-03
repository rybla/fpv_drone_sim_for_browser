import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d-compat";
import { ColliderDesc } from "@dimforge/rapier3d-compat";

// TODO: make `i` actually an arguemnt `pos: THREE.Vector3` that sets the position
export function createBarrier(
  scene: THREE.Scene,
  world: RAPIER.World,
  i: number,
) {
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
  scene.add(barrierMesh);
  const barrierCol = world.createCollider(
    ColliderDesc.cuboid(2, 1, 0.25).setTranslation(5 + i * 5, 1, 8),
  );

  return { mesh: barrierMesh, collider: barrierCol };
}
