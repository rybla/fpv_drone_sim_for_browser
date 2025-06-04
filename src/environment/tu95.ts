import { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type Level from "../level/Level";

export async function createTU96(level: Level, pos: THREE.Vector3) {
  console.log("create TU96");
  // Create a group to hold the plane
  const planeGroup = new THREE.Group();

  const loader = new GLTFLoader();
  const tu95Model = (
    await loader.loadAsync("/models/gltf/tu95.gltf")
  ).scene.clone();

  planeGroup.add(tu95Model);

  // Enable shadows for all meshes in the model
  planeGroup.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  planeGroup.position.set(pos.x, pos.y, pos.z);

  // Add to scene
  level.scene.add(planeGroup);

  // Create collider - adjust dimensions based on your TU-95 model size
  const _planeCol = level.world.createCollider(
    ColliderDesc.cuboid(5, 3, 10).setTranslation(pos.x, pos.y + 3, pos.z),
  );
  void _planeCol;
}
