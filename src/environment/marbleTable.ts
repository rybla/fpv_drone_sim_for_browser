import { ColliderDesc } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type Level from "../level/Level";

export async function createMarbleTable(level: Level, pos: THREE.Vector3) {
  console.log("create MarbleTable");
  // Create a group to hold the marble table
  const marbleTableGroup = new THREE.Group();
  const loader = new GLTFLoader();
  const marbleTableModel = (
    await loader.loadAsync("/models/gltf/marbleTable.gltf")
  ).scene.clone();
  marbleTableModel.scale.set(4, 4, 4);
  marbleTableGroup.add(marbleTableModel);

  // Enable shadows for all meshes in the model
  marbleTableGroup.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  marbleTableGroup.position.set(pos.x, pos.y, pos.z);

  // Add to scene
  level.scene.add(marbleTableGroup);

  // Create static colliders from mesh geometry
  marbleTableGroup.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry;

      // Get world matrix for this mesh
      mesh.updateWorldMatrix(true, false);
      const worldMatrix = mesh.matrixWorld.clone();

      // Clone geometry to avoid modifying the original
      const clonedGeometry = geometry.clone();
      clonedGeometry.applyMatrix4(worldMatrix);

      // Get vertices and indices for the trimesh collider
      const vertices = new Float32Array(
        clonedGeometry.attributes.position.array,
      );

      // Get indices - handle both indexed and non-indexed geometries
      let indices: Uint32Array;
      if (clonedGeometry.index) {
        indices = new Uint32Array(clonedGeometry.index.array);
      } else {
        // Create proper triangle indices for non-indexed geometry
        const vertexCount = vertices.length / 3;
        const triangleCount = vertexCount / 3;
        indices = new Uint32Array(vertexCount);
        for (let i = 0; i < triangleCount; i++) {
          const baseIndex = i * 3;
          indices[baseIndex] = baseIndex;
          indices[baseIndex + 1] = baseIndex + 1;
          indices[baseIndex + 2] = baseIndex + 2;
        }
      }

      // Create trimesh collider - DON'T set translation since it's already in the vertices
      const trimeshDesc = ColliderDesc.trimesh(vertices, indices);

      // Create the collider
      level.world.createCollider(trimeshDesc);
    }
  });
}
