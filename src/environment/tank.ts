import { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type Level from "../level/Level";

// TODO: make `pos` actually specify the position correctly
export function createTank(level: Level, pos: THREE.Vector3) {
  const militaryMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a2a,
    roughness: 0.9,
    metalness: 0.1,
  });

  // tank
  const tankGroup = new THREE.Group();
  const tankBody = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1, 6),
    militaryMaterial,
  );
  tankBody.position.y = 0.5;
  tankBody.position.set(pos.x, pos.y, pos.z);
  tankBody.castShadow = true;
  tankGroup.add(tankBody);

  const turret = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.8, 2),
    militaryMaterial,
  );
  turret.position.y = 1.2;
  turret.castShadow = true;
  tankGroup.add(turret);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 3),
    militaryMaterial,
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(1.5, 1.2, 0);
  barrel.castShadow = true;
  tankGroup.add(barrel);

  tankGroup.position.set(-8, 0, -5);

  const tankCol = level.world.createCollider(
    ColliderDesc.cuboid(1.5, 0.5, 3).setTranslation(-8, 0.5, -5),
  );

  level.scene.add(tankGroup);

  return { mesh: tankGroup, collider: tankCol };
}
