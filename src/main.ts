import RAPIER, {
  ColliderDesc,
  RigidBodyDesc,
  Vector3,
  World,
} from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import "./style.css";

async function main() {
  // Initialize Rapier
  async function initializeRapier() {
    await RAPIER.init();
  }

  // Call the initialization function
  await initializeRapier();

  const world = new World(new Vector3(0, -9.81, 0));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  // Three.js object
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(boxMesh);

  const boxRb = world.createRigidBody(
    RigidBodyDesc.dynamic()
      .setTranslation(0.0, 1.0, -2.0)
      .setLinvel(0.0, 0.0, 0.0)
      .setAngvel(new Vector3(0.0, 0.0, 0.0)),
  );

  const boxCol = world.createCollider(
    ColliderDesc.cuboid(0.5, 0.5, 0.5),
    boxRb,
  );

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update function (called on each frame)
  function updatePhysics() {
    world.timestep = 1 / 60;
    world.step();
    boxMesh.position.set(
      boxRb.translation().x,
      boxRb.translation().y,
      boxRb.translation().z,
    );
    boxMesh.quaternion.set(
      boxRb.rotation().x,
      boxRb.rotation().y,
      boxRb.rotation().z,
      boxRb.rotation().w,
    );
  }

  function animate() {
    requestAnimationFrame(animate);

    updatePhysics();
    renderer.render(scene, camera);
  }

  animate();

  document.body.appendChild(renderer.domElement);
}

main();
