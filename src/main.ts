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
  // texture loader
  // ---------------------------------------------------------------------------

  const textureLoader = new THREE.TextureLoader();

  // ---------------------------------------------------------------------------
  // skybox
  // ---------------------------------------------------------------------------

  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skybox = cubeTextureLoader
    .setPath("/")
    .load([
      "nightsky_rt.png",
      "nightsky_lf.png",
      "nightsky_up.png",
      "nightsky_dn.png",
      "nightsky_bk.png",
      "nightsky_ft.png",
    ]);

  scene.background = skybox; // shows in the backdrop
  scene.environment = skybox; // lets reflective materials pick it up

  // ---------------------------------------------------------------------------
  // camera
  // ---------------------------------------------------------------------------

  const fpvCamera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  fpvCamera.position.set(0, 1, 0);
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

  // Physics constants
  const droneMass = 0.065;
  const maxThrust = 1.28; // N (2x hover thrust)
  const hoverThrottle = (droneMass * 9.81) / maxThrust;

  // Control inputs
  const controls = {
    throttle: hoverThrottle,
    pitch: 0,
    roll: 0,
    yaw: 0,
  };

  const targetControls = { ...controls };
  const keys: { [key: string]: boolean } = {};

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

  // Use a darker metallic material so the lighting has nicer highlights
  const droneMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.3,
    metalness: 0.7,
  });

  const droneGroup = new THREE.Group();
  scene.add(droneGroup);

  // chassis
  const chassisGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.6);
  const chassisMesh = new THREE.Mesh(chassisGeometry, droneMaterial);
  chassisMesh.castShadow = true;
  droneGroup.add(chassisMesh);

  // arms
  const armLength = 0.8;
  const armThickness = 0.05;
  const armXGeometry = new THREE.BoxGeometry(
    armLength,
    armThickness,
    armThickness,
  );
  const armXMesh = new THREE.Mesh(armXGeometry, droneMaterial);
  armXMesh.castShadow = true;
  droneGroup.add(armXMesh);

  const armZGeometry = new THREE.BoxGeometry(
    armThickness,
    armThickness,
    armLength,
  );
  const armZMesh = new THREE.Mesh(armZGeometry, droneMaterial);
  armZMesh.castShadow = true;
  droneGroup.add(armZMesh);

  // propellers
  const propellers: THREE.Mesh[] = [];
  const propGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
  const propMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const propPositions = [
    [armLength / 2, 0.05, 0],
    [-armLength / 2, 0.05, 0],
    [0, 0.05, armLength / 2],
    [0, 0.05, -armLength / 2],
  ];
  for (const pos of propPositions) {
    const prop = new THREE.Mesh(propGeometry, propMaterial);
    prop.castShadow = true;
    prop.position.set(pos[0], pos[1], pos[2]);
    droneGroup.add(prop);
    propellers.push(prop);
  }

  const droneMesh = droneGroup;
  const droneBody = world.createRigidBody(
    RigidBodyDesc.dynamic()
      .setTranslation(0.0, 1.0, -2.0)
      .setLinvel(0.0, 0.0, 0.0)
      .setAngvel(new Vector3(0.0, 0.0, 0.0))
      .setCcdEnabled(true),
  );

  world.createCollider(
    ColliderDesc.cuboid(0.52, 0.075, 0.52)
      .setMass(droneMass)
      .setRestitution(0.2)
      .setFriction(0.5),
    droneBody,
  );

  // ---------------------------------------------------------------------------
  // floor
  // ---------------------------------------------------------------------------

  const floorSize = 10000;
  const floorTexture = textureLoader.load("/floor.png");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  const textureRepeats = floorSize / 20;
  floorTexture.repeat.set(textureRepeats, textureRepeats);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
    map: floorTexture,
  });
  const floorGeometry = new THREE.BoxGeometry(floorSize, 0.2, floorSize);
  floorGeometry.computeVertexNormals();
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.1;
  floor.receiveShadow = true;
  scene.add(floor);
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(
      floorSize / 2,
      0.1,
      floorSize / 2,
    ).setTranslation(0, -0.1, 0),
  );

  // ---------------------------------------------------------------------------
  // military objects
  // ---------------------------------------------------------------------------

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
  scene.add(tankGroup);
  world.createCollider(
    ColliderDesc.cuboid(1.5, 0.5, 3).setTranslation(-8, 0.5, -5),
  );

  // concrete barriers
  for (let i = 0; i < 3; i++) {
    const barrier = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 0.5),
      militaryMaterial,
    );
    barrier.position.set(5 + i * 5, 1, 8);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    scene.add(barrier);
    world.createCollider(
      ColliderDesc.cuboid(2, 1, 0.25).setTranslation(5 + i * 5, 1, 8),
    );
  }

  // bunker
  const bunker = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    militaryMaterial,
  );
  bunker.position.set(10, 1.5, -10);
  bunker.castShadow = true;
  bunker.receiveShadow = true;
  scene.add(bunker);
  world.createCollider(
    ColliderDesc.cuboid(2, 1.5, 2).setTranslation(10, 1.5, -10),
  );

  // ---------------------------------------------------------------------------
  // lighting
  // ---------------------------------------------------------------------------

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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

  // Additional point lights to softly illuminate the scene
  const pointLight1 = new THREE.PointLight(0xffffff, 0.6);
  pointLight1.position.set(5, 3, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.6);
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
    if (keys["arrowup"]) {
      targetControls.throttle = Math.min(
        1,
        targetControls.throttle + throttleSpeed * deltaTime,
      );
    } else if (keys["arrowdown"]) {
      targetControls.throttle = Math.max(
        0,
        targetControls.throttle - throttleSpeed * deltaTime,
      );
    } else {
      targetControls.throttle = hoverThrottle;
    }

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

    // spin propellers based on throttle
    for (const prop of propellers) {
      prop.rotation.y += controls.throttle * 20 * deltaTime;
    }

    // cameras

    fpvCamera.position.set(dronePos.x, dronePos.y, dronePos.z);
    fpvCamera.quaternion.set(droneRot.x, droneRot.y, droneRot.z, droneRot.w);

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
