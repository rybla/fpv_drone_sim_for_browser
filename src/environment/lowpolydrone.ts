import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type RAPIER from "@dimforge/rapier3d-compat";
import { ColliderDesc } from "@dimforge/rapier3d-compat";

export function createLowPolyDrone(
  scene: THREE.Scene,
  world: RAPIER.World,
  pos: THREE.Vector3,
) {
  // Pre-load the model
  let lowPolyDroneModel: THREE.Group | null = null;
  const loader = new GLTFLoader();
  loader.load("/models/gltf/lowpolydrone.gltf", (gltf: GLTF) => {
    lowPolyDroneModel = gltf.scene;
    // Create a group to hold the plane
    const droneGroup = new THREE.Group();

    if (lowPolyDroneModel) {
      const modelClone = lowPolyDroneModel.clone();
      modelClone.scale.set(0.01, 0.01, 0.01);
      droneGroup.add(modelClone);

      // Enable shadows for all meshes in the model
      droneGroup.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      // Placeholder geometry while model loads
      // Load model and replace placeholder when ready
    }

    // Position the drone
    droneGroup.position.set(pos.x, pos.y, pos.z);

    // Add to scene
    scene.add(droneGroup);

    // Create collider - adjust dimensions based on your TU-95 model size
    const planeCol = world.createCollider(
      ColliderDesc.cuboid(1, 1, 1).setTranslation(pos.x, pos.y + 3, pos.z),
    );
  });
}
