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
  // drone
  // ---------------------------------------------------------------------------

  // const BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  // const droneMaterial = new THREE.MeshStandardMaterial({
  //   color: 0xff00ff,
  //   roughness: 0.5,
  //   metalness: 0.1,
  // });
  // const droneMesh = new THREE.Mesh(BoxGeometry, droneMaterial);
  // droneMesh.castShadow = true;
  // scene.add(droneMesh);
  // const droneBody = world.createRigidBody(
  //   RigidBodyDesc.dynamic()
  //     .setTranslation(0.0, 1.0, -2.0)
  //     .setLinvel(0.0, 0.0, 0.0)
  //     .setAngvel(new Vector3(0.0, 0.0, 0.0))
  //     .setCcdEnabled(true),
  // );

  // // droneCol
  // world.createCollider(
  //   ColliderDesc.cuboid(0.5, 0.5, 0.5)
  //     .setMass(0.065)
  //     .setRestitution(0.2)
  //     .setFriction(0.5),
  //   droneBody,
  // );

  // HERE
  //
  // Create detailed drone model
  const droneMesh = new THREE.Group();

  // Main body (central hub)
  const mainBodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 8);
  const mainBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.3,
    metalness: 0.7,
  });
  const centralBody = new THREE.Mesh(mainBodyGeometry, mainBodyMaterial);
  centralBody.castShadow = true;
  droneMesh.add(centralBody);

  // Battery compartment
  const batteryGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.08);
  const batteryMaterial = new THREE.MeshStandardMaterial({
    color: 0x34495e,
    roughness: 0.5,
    metalness: 0.3,
  });
  const batteryPack = new THREE.Mesh(batteryGeometry, batteryMaterial);
  batteryPack.position.y = 0.02;
  batteryPack.castShadow = true;
  droneMesh.add(batteryPack);

  // Create arms and rotors
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    roughness: 0.4,
    metalness: 0.2,
  });
  const motorMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f8c8d,
    roughness: 0.3,
    metalness: 0.8,
  });
  const propellerMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  // Arm and rotor positions
  const motorPositions: THREE.Vector3[] = [
    new THREE.Vector3(0.25, 0, 0.25), // front right
    new THREE.Vector3(-0.25, 0, 0.25), // front left
    new THREE.Vector3(0.25, 0, -0.25), // back right
    new THREE.Vector3(-0.25, 0, -0.25), // back left
  ];

  const propellerGroups: THREE.Group[] = [];

  motorPositions.forEach((pos: THREE.Vector3, index: number) => {
    // Arm
    const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6);
    const droneArm = new THREE.Mesh(armGeometry, armMaterial);

    // Calculate arm rotation to point towards motor position
    const armAngle: number = Math.atan2(pos.x, pos.z);
    droneArm.rotation.z = Math.PI / 2;
    droneArm.rotation.y = armAngle;
    droneArm.position.set(pos.x * 0.5, 0, pos.z * 0.5);
    droneArm.castShadow = true;
    droneMesh.add(droneArm);

    // Motor housing
    const motorHousingGeometry = new THREE.CylinderGeometry(
      0.04,
      0.04,
      0.06,
      8,
    );
    const motorHousing = new THREE.Mesh(motorHousingGeometry, motorMaterial);
    motorHousing.position.copy(pos);
    motorHousing.position.y = 0.03;
    motorHousing.castShadow = true;
    droneMesh.add(motorHousing);

    // Propeller group (for spinning animation later)
    const propellerGroup = new THREE.Group();
    propellerGroup.position.copy(pos);
    propellerGroup.position.y = 0.08;

    // Propeller hub
    const hubGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
    const propellerHub = new THREE.Mesh(hubGeometry, motorMaterial);
    propellerGroup.add(propellerHub);

    // Propeller blades
    const bladeGeometry = new THREE.BoxGeometry(0.3, 0.002, 0.03);
    const propellerBlade1 = new THREE.Mesh(bladeGeometry, propellerMaterial);
    propellerBlade1.position.y = 0.012;
    propellerBlade1.castShadow = true;
    propellerGroup.add(propellerBlade1);

    const propellerBlade2 = new THREE.Mesh(bladeGeometry, propellerMaterial);
    propellerBlade2.rotation.y = Math.PI / 2;
    propellerBlade2.position.y = 0.012;
    propellerBlade2.castShadow = true;
    propellerGroup.add(propellerBlade2);

    droneMesh.add(propellerGroup);
    propellerGroups.push(propellerGroup);
  });

  // LED indicators
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x004400,
    roughness: 0.1,
    metalness: 0.1,
  });
  const ledGeometry = new THREE.SphereGeometry(0.01, 8, 8);

  // Front LEDs (green)
  const frontLed1 = new THREE.Mesh(ledGeometry, ledMaterial);
  frontLed1.position.set(0.05, 0.02, 0.14);
  droneMesh.add(frontLed1);

  const frontLed2 = new THREE.Mesh(ledGeometry, ledMaterial);
  frontLed2.position.set(-0.05, 0.02, 0.14);
  droneMesh.add(frontLed2);

  // Back LEDs (red)
  const backLedMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0x440000,
    roughness: 0.1,
    metalness: 0.1,
  });
  const backLed1 = new THREE.Mesh(ledGeometry, backLedMaterial);
  backLed1.position.set(0.05, 0.02, -0.14);
  droneMesh.add(backLed1);

  const backLed2 = new THREE.Mesh(ledGeometry, backLedMaterial);
  backLed2.position.set(-0.05, 0.02, -0.14);
  droneMesh.add(backLed2);

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
      droneBody.setTranslation({ x: 0, y: 1, z: 0 }, true);
      droneBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      droneBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      droneBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
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
      droneBody.resetForces(true);
      droneBody.resetTorques(true);

      // Calculate thrust
      const thrustMagnitude = controls.throttle * maxThrust;
      const rotation = droneBody.rotation();

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
      droneBody.addForce(thrustVector, true);

      // Calculate torques in local space
      const pitchTorque = controls.pitch * maxPitchTorque;
      const rollTorque = -controls.roll * maxRollTorque;
      const yawTorque = controls.yaw * maxYawTorque;

      // Convert to world space
      const localTorque = new THREE.Vector3(pitchTorque, yawTorque, rollTorque);
      const worldTorque = localTorque.clone().applyQuaternion(quaternion);

      droneBody.addTorque(
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

    // drone
    const dronePos = droneBody.translation();
    const droneRot = droneBody.rotation();
    droneMesh.position.set(dronePos.x, dronePos.y, dronePos.z);
    droneMesh.quaternion.set(droneRot.x, droneRot.y, droneRot.z, droneRot.w);

    // cameras
    chaseCamera.position.set(dronePos.x, dronePos.y + 2, dronePos.z + 3);
    chaseCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);

    topCamera.position.set(dronePos.x, 10, dronePos.z);
    topCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);

    // ---------------------------------------------------------------------------
    // render scene
    // ---------------------------------------------------------------------------

    renderer.render(scene, currentCamera);
  }

  update();
}

main();
