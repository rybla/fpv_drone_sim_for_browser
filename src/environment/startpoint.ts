import RAPIER, { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type Level from "../level/Level";

export type Startpoint = {
  mesh: THREE.Mesh;
  collider: RAPIER.Collider;
  done: boolean;
};

export function createStartpoint(
  level: Level,
  position: THREE.Vector3,
  radius = 0.25,
): Startpoint {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
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
