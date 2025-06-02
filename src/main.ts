import RAPIER, {
  ColliderDesc,
  RigidBodyDesc,
  Vector3,
  World,
} from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import "./style.css";

async function main() {
  await RAPIER.init();

  // ---------------------------------------------------------------------------
  // world
  // ---------------------------------------------------------------------------

  const world = new World({ x: 0.0, y: -9.81, z: 0.0 });

  // ---------------------------------------------------------------------------
  // scene
  // ---------------------------------------------------------------------------

  const scene = new THREE.Scene();

  // ---------------------------------------------------------------------------
  // camera
  // ---------------------------------------------------------------------------

  const fpvCamera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  fpvCamera.position.set(0, 2, 2);
  const chaseCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  const topCamera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  let currentCamera = fpvCamera;

  // ---------------------------------------------------------------------------
  // renderer
  // ---------------------------------------------------------------------------

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // ---------------------------------------------------------------------------
  // controls
  // ---------------------------------------------------------------------------

  // Control inputs
  const controls = {
    throttle: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
  };

  const targetControls = { ...controls };
  const keys: { [key: string]: boolean } = {};

  // Physics constants
  const maxThrust = 1.28; // N (2x hover thrust)
  const maxPitchTorque = 0.015;
  const maxRollTorque = 0.015;
  const maxYawTorque = 0.008;

  // Input handling
  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // ---------------------------------------------------------------------------
  // box
  // ---------------------------------------------------------------------------

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    roughness: 0.5,
    metalness: 0.1,
  });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.castShadow = true;
  scene.add(boxMesh);
  const boxBody = world.createRigidBody(
    RigidBodyDesc.dynamic()
      .setTranslation(0.0, 1.0, -2.0)
      .setLinvel(0.0, 0.0, 0.0)
      .setAngvel(new Vector3(0.0, 0.0, 0.0))
      .setCcdEnabled(true),
  );
  const boxCol = world.createCollider(
    ColliderDesc.cuboid(0.5, 0.5, 0.5)
      .setMass(0.065)
      .setRestitution(0.2)
      .setFriction(0.5),
    boxBody,
  );

  // ---------------------------------------------------------------------------
  // floor
  // ---------------------------------------------------------------------------

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1,
  });
  const floorGeometry = new THREE.BoxGeometry(30, 0.2, 30);
  floorGeometry.computeVertexNormals();
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  scene.add(floor);
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(15, 0.1, 15).setTranslation(0, -0.1, 0),
  );

  // ---------------------------------------------------------------------------
  // lighting
  // ---------------------------------------------------------------------------

  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  // Point lights for indoor feel
  const pointLight1 = new THREE.PointLight(0xffaa00, 0.5);
  pointLight1.position.set(5, 3, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x00aaff, 0.3);
  pointLight2.position.set(-5, 3, -5);
  scene.add(pointLight2);

  // ---------------------------------------------------------------------------
  // time
  // ---------------------------------------------------------------------------

  const clock = new THREE.Clock();
  let accumulator = 0;
  world.timestep = 1 / 60;
  const fixedTimeStep = 1 / 60;

  function update() {
    requestAnimationFrame(update);

    // ---------------------------------------------------------------------------
    // update time
    // ---------------------------------------------------------------------------

    const deltaTime = Math.min(clock.getDelta(), 0.1);
    accumulator += deltaTime;

    // ---------------------------------------------------------------------------
    // update controls
    // ---------------------------------------------------------------------------

    // Handle input
    const throttleSpeed = 1.0;

    // Throttle (up/down arrows)
    if (keys["arrowup"])
      targetControls.throttle = Math.min(
        1,
        targetControls.throttle + throttleSpeed * deltaTime,
      );
    if (keys["arrowdown"])
      targetControls.throttle = Math.max(
        0,
        targetControls.throttle - throttleSpeed * deltaTime,
      );

    // Pitch (W/S)
    targetControls.pitch = 0;
    if (keys["w"]) targetControls.pitch = -1;
    if (keys["s"]) targetControls.pitch = 1;

    // Roll (A/D)
    targetControls.roll = 0;
    if (keys["a"]) targetControls.roll = -1;
    if (keys["d"]) targetControls.roll = 1;

    // Yaw (Q/E)
    targetControls.yaw = 0;
    if (keys["q"]) targetControls.yaw = -1;
    if (keys["e"]) targetControls.yaw = 1;

    // Reset position
    if (keys["r"]) {
      boxBody.setTranslation({ x: 0, y: 1, z: 0 }, true);
      boxBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      boxBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      boxBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Camera switching
    if (keys["1"]) {
      console.log("Switching to FPV camera");
      currentCamera = fpvCamera;
    }
    if (keys["2"]) {
      console.log("Switching to chase camera");
      currentCamera = chaseCamera;
    }
    if (keys["3"]) {
      console.log("Switching to top camera");
      currentCamera = topCamera;
    }

    // Smooth control inputs
    const controlSmoothing = 5.0;
    controls.throttle +=
      (targetControls.throttle - controls.throttle) *
      controlSmoothing *
      deltaTime;
    controls.pitch +=
      (targetControls.pitch - controls.pitch) * controlSmoothing * deltaTime;
    controls.roll +=
      (targetControls.roll - controls.roll) * controlSmoothing * deltaTime;
    controls.yaw +=
      (targetControls.yaw - controls.yaw) * controlSmoothing * deltaTime;

    // ---------------------------------------------------------------------------
    // update physics
    // ---------------------------------------------------------------------------

    while (accumulator >= fixedTimeStep) {
      // Reset forces
      boxBody.resetForces(true);
      boxBody.resetTorques(true);

      // Calculate thrust
      const thrustMagnitude = controls.throttle * maxThrust;
      const rotation = boxBody.rotation();

      // Transform local up vector to world space
      const localUp = new THREE.Vector3(0, 1, 0);
      const worldUp = localUp.clone();
      const quaternion = new THREE.Quaternion(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w,
      );
      worldUp.applyQuaternion(quaternion);

      // Apply thrust
      const thrustVector = {
        x: worldUp.x * thrustMagnitude,
        y: worldUp.y * thrustMagnitude,
        z: worldUp.z * thrustMagnitude,
      };
      boxBody.addForce(thrustVector, true);

      // Calculate torques in local space
      const pitchTorque = controls.pitch * maxPitchTorque;
      const rollTorque = -controls.roll * maxRollTorque;
      const yawTorque = controls.yaw * maxYawTorque;

      // Convert to world space
      const localTorque = new THREE.Vector3(pitchTorque, yawTorque, rollTorque);
      const worldTorque = localTorque.clone().applyQuaternion(quaternion);

      boxBody.addTorque(
        {
          x: worldTorque.x,
          y: worldTorque.y,
          z: worldTorque.z,
        },
        true,
      );

      world.step();

      accumulator -= fixedTimeStep;
    }

    // ---------------------------------------------------------------------------
    // graphics
    // ---------------------------------------------------------------------------

    // box
    const boxPos = boxBody.translation();
    const boxRot = boxBody.rotation();
    boxMesh.position.set(boxPos.x, boxPos.y, boxPos.z);
    boxMesh.quaternion.set(boxRot.x, boxRot.y, boxRot.z, boxRot.w);

    // cameras
    chaseCamera.position.set(boxPos.x, boxPos.y + 2, boxPos.z + 3);
    chaseCamera.lookAt(boxPos.x, boxPos.y, boxPos.z);

    topCamera.position.set(boxPos.x, 10, boxPos.z);
    topCamera.lookAt(boxPos.x, boxPos.y, boxPos.z);

    // ---------------------------------------------------------------------------
    // render scene
    // ---------------------------------------------------------------------------

    renderer.render(scene, currentCamera);
  }

  update();
}

main();
