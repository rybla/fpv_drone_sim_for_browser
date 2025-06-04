import type Level from "../level/Level";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Drone } from "../level/Level";
import RAPIER from "@dimforge/rapier3d-compat";
import * as config from "../config";

export async function createLowpolydrone(level: Level): Promise<Drone> {
  console.log("create Lowpolydrone");
  const droneGroup = new THREE.Group();

  console.log("Creating lowpoly drone");
  const loader = new GLTFLoader();
  const droneModel = (
    await loader.loadAsync("/models/gltf/lowpolydrone.gltf")
  ).scene.clone();
  droneModel.scale.set(0.01, 0.01, 0.01);
  droneGroup.add(droneModel);

  // Enable shadows for all meshes in the model
  droneGroup.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // ─── Store references to the 4 wing meshes so we can spin them ───
  const propellers: THREE.Object3D[] = [];
  droneModel.traverse((child: THREE.Object3D) => {
    // Wing nodes are named "Wing1", "Wing2", … in this GLTF
    if (child.name.startsWith("Wing")) {
      propellers.push(child);
    }
  });

  const droneBody = level.world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0.0, 1.0, -2.0)
      .setLinvel(0.0, 0.0, 0.0)
      .setAngvel(new THREE.Vector3(0.0, 0.0, 0.0))
      .setCcdEnabled(true),
  );

  const droneCol = level.world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.52, 0.075, 0.52)
      .setMass(config.droneMass)
      .setRestitution(0.2)
      .setFriction(0.5),
    droneBody,
  );

  level.scene.add(droneGroup);

  return {
    body: droneBody,
    group: droneGroup,
    propellers: propellers,
    collider: droneCol,
  };
}
