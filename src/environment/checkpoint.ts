import RAPIER, { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type Level from "../level/Level";

export type Checkpoint = {
  mesh: THREE.Mesh;
  collider: RAPIER.Collider;
  done: boolean;
};

export function createCheckpoint(
  level: Level,
  position: THREE.Vector3,
  radius = 0.25,
): Checkpoint {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.position.copy(position);
  level.scene.add(mesh);

  const collider = level.world.createCollider(
    ColliderDesc.ball(radius)
      .setTranslation(position.x, position.y, position.z)
      .setSensor(true),
  );

  return { mesh, collider, done: false };
}
