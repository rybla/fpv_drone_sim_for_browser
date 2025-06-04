import type Level from "../level/Level";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Drone } from "../level/Level";
import RAPIER from "@dimforge/rapier3d-compat";
import * as config from "../config";

export async function createNanodrone(level: Level): Promise<Drone> {
  console.log("create Nanodrone");
  const droneGroup = new THREE.Group();
  console.log("Creating nanodrone");

  const loader = new GLTFLoader();

  // Load the nanodrone model
  const nanodroneModel = (
    await loader.loadAsync("/models/gltf/nanodrone.gltf")
  ).scene.clone();
  nanodroneModel.scale.set(0.01, 0.01, 0.01);

  // Apply black gunmetal material to the nanodrone body
  const gunmetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222, // dark gunmetal
    metalness: 0.9,
    roughness: 0.25,
  });

  nanodroneModel.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.material = gunmetalMaterial;
    }
  });

  droneGroup.add(nanodroneModel);

  // Load the lowpolydrone ONLY to extract propellers
  const lowpolydroneModel = (
    await loader.loadAsync("/models/gltf/lowpolydrone.gltf")
  ).scene.clone();
  2;
  // Extract propellers from lowpolydrone
  const propellers: THREE.Object3D[] = [];
  const propellerPositions = [
    { x: -0.32, y: 0.3, z: -0.3 }, // Front-right
    { x: 0.32, y: 0.3, z: -0.3 }, // Back-right
    { x: 0.32, y: 0.3, z: 0.3 }, // Front-left
    { x: -0.32, y: 0.3, z: -0.3 }, // Back-left
  ];

  // First, collect all Wing objects
  const foundWings: THREE.Object3D[] = [];
  lowpolydroneModel.traverse((child: THREE.Object3D) => {
    if (child.name.startsWith("Wing")) {
      foundWings.push(child);
    }
  });

  // Now create 4 propellers, reusing found wings if necessary
  for (let i = 0; i < 4; i++) {
    // Use modulo to cycle through found wings if we have fewer than 4
    const wingToUse = foundWings[i % foundWings.length];

    if (wingToUse) {
      // Clone the propeller to avoid reference issues
      const propellerClone = wingToUse.clone();

      // Create a container group for each propeller to handle positioning
      const propellerContainer = new THREE.Group();

      // Scale the propeller to 0.2
      propellerClone.scale.set(0.35, 0.35, 0.35);

      // Rotate 90 degrees to make it parallel to ground (around X axis)
      propellerClone.rotation.x = (3 * Math.PI) / 2;

      if (i > 1) {
        propellerClone.rotation.x -= Math.PI;
      }

      // Add the propeller to its container
      propellerContainer.add(propellerClone);

      // Position the container at one of the 4 corners
      const pos = propellerPositions[i];

      propellerContainer.position.set(pos.x, -0.12, pos.z);

      // Add container to the nanodrone group
      droneGroup.add(propellerContainer);

      // Store reference to the propeller itself (not the container) for spinning
      propellers.push(propellerClone);
    }
  }

  // Enable shadows for all meshes in the model
  droneGroup.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
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

  // const geometry = new THREE.BoxGeometry(0.52, 0.075, 0.52);
  // const edges = new THREE.EdgesGeometry(geometry);
  // const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  // const line = new THREE.LineSegments(edges, material);
  // geometry.dispose();
  // droneGroup.add(line);

  level.scene.add(droneGroup);

  return {
    body: droneBody,
    group: droneGroup,
    propellers: propellers,
    collider: droneCol,
  };
}
