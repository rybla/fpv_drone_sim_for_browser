import RAPIER, {
  ColliderDesc,
  RigidBodyDesc,
  Vector3,
} from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { Controls } from "./common";
import * as config from "./config";
import { createBarrier } from "./environment/barrier";
import { createFloor } from "./environment/floor";
import { createLighting } from "./environment/lighting";
import { createTank } from "./environment/tank";
import "./style.css";
import { createHUD, updateHUD } from "./ui/hud";
import BasicLevel from "./level/BasicLevel";

async function main() {
  await RAPIER.init();
  const level = new BasicLevel();
  createHUD();

  // ---------------------------------------------------------------------------
  // controls
  // ---------------------------------------------------------------------------

  // Control inputs
  const controls: Controls = {
    throttle: config.hoverThrottle,
    pitch: 0,
    roll: 0,
    yaw: 0,
  };

  const targetControls = { ...controls };

  // Battery state
  let batteryLevel = 100; // percentage

  // Input handling
  window.addEventListener("keydown", (e) => {
    level.keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    level.keys[e.key.toLowerCase()] = false;
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
  level.scene.add(droneGroup);

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
  const droneBody = level.world.createRigidBody(
    RigidBodyDesc.dynamic()
      .setTranslation(0.0, 1.0, -2.0)
      .setLinvel(0.0, 0.0, 0.0)
      .setAngvel(new Vector3(0.0, 0.0, 0.0))
      .setCcdEnabled(true),
  );

  const droneCol = level.world.createCollider(
    ColliderDesc.cuboid(0.52, 0.075, 0.52)
      .setMass(config.droneMass)
      .setRestitution(0.2)
      .setFriction(0.5),
    droneBody,
  );

  createFloor(level);

  // ---------------------------------------------------------------------------
  // military objects
  // ---------------------------------------------------------------------------

  createTank(level.scene, level.world, new THREE.Vector3(0, 0.5, 0));

  // concrete barriers
  for (let i = 0; i < 3; i++) {
    createBarrier(level.scene, level.world, i);
  }

  {
    const militaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a2a,
      roughness: 0.9,
      metalness: 0.1,
    });

    // bunker
    const bunker = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 4),
      militaryMaterial,
    );
    bunker.position.set(10, 1.5, -10);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    level.scene.add(bunker);
    level.world.createCollider(
      ColliderDesc.cuboid(2, 1.5, 2).setTranslation(10, 1.5, -10),
    );
  }

  createLighting(level.scene);

  // ---------------------------------------------------------------------------
  // time
  // ---------------------------------------------------------------------------

  const clock = new THREE.Clock();
  let accumulator = 0;
  level.world.timestep = 1 / 60;
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

    const throttleSpeed = 1.0;

    // hover throttle that takes into account drone rotation
    let dynamicHoverThrottleToUse: number;

    const currentDroneRotation = droneBody.rotation();
    const droneQuaternionForHover = new THREE.Quaternion(
      currentDroneRotation.x,
      currentDroneRotation.y,
      currentDroneRotation.z,
      currentDroneRotation.w,
    );
    const droneLocalUp = new THREE.Vector3(0, 1, 0);
    const droneWorldUp = droneLocalUp
      .clone()
      .applyQuaternion(droneQuaternionForHover);
    const alignmentFactor = droneWorldUp.y;

    const calculatedBaseHoverThrottle =
      (config.droneMass * Math.abs(level.world.gravity.y)) / config.maxThrust;

    if (alignmentFactor <= 0) {
      dynamicHoverThrottleToUse = 0.0;
    } else {
      dynamicHoverThrottleToUse =
        calculatedBaseHoverThrottle / Math.max(alignmentFactor, 0.1);
      dynamicHoverThrottleToUse = Math.min(
        1.0,
        Math.max(0.0, dynamicHoverThrottleToUse),
      );
    }

    // Throttle (up/down arrows)
    if (level.keys["arrowup"]) {
      targetControls.throttle = Math.min(
        1,
        targetControls.throttle + throttleSpeed * deltaTime,
      );
    } else if (level.keys["arrowdown"]) {
      targetControls.throttle = Math.max(
        0,
        targetControls.throttle - throttleSpeed * deltaTime,
      );
    } else {
      targetControls.throttle = config.hoverThrottle;
    }

    // Pitch (W/S)
    targetControls.pitch = 0;
    if (level.keys["w"]) targetControls.pitch = -1;
    if (level.keys["s"]) targetControls.pitch = 1;

    // Roll (A/D)
    targetControls.roll = 0;
    if (level.keys["a"]) targetControls.roll = -1;
    if (level.keys["d"]) targetControls.roll = 1;

    // Yaw (Q/E)
    targetControls.yaw = 0;
    if (level.keys["q"]) targetControls.yaw = -1;
    if (level.keys["e"]) targetControls.yaw = 1;

    // Reset position
    if (level.keys["r"]) {
      droneBody.setTranslation({ x: 0, y: 1, z: 0 }, true);
      droneBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      droneBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      droneBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
      batteryLevel = 100;
    }

    // Camera switching
    if (level.keys["1"]) {
      console.log("Switching to FPV camera");
      level.currentCamera = level.fpvCamera;
    }
    if (level.keys["2"]) {
      console.log("Switching to chase camera");
      level.currentCamera = level.chaseCamera;
    }
    if (level.keys["3"]) {
      console.log("Switching to top camera");
      level.currentCamera = level.topCamera;
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
    // update battery
    // ---------------------------------------------------------------------------

    // Update battery
    const throttleSquared = controls.throttle * controls.throttle;
    const drainRate =
      (100 / config.maxFlightTime) * (0.5 + throttleSquared * 1.5); // Base drain + throttle-based drain
    batteryLevel = Math.max(0, batteryLevel - drainRate * deltaTime);

    // ---------------------------------------------------------------------------
    // update physics
    // ---------------------------------------------------------------------------

    while (accumulator >= fixedTimeStep) {
      // Reset forces
      droneBody.resetForces(true);
      droneBody.resetTorques(true);

      // Calculate thrust
      const thrustMagnitude = controls.throttle * config.maxThrust;
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

      let finalPitchTorque = controls.pitch * config.maxPitchTorque;
      let finalRollTorque = -controls.roll * config.maxRollTorque;
      let finalYawTorque = controls.yaw * config.maxYawTorque;

      const noManualPitchRoll =
        targetControls.pitch === 0 && targetControls.roll === 0;

      if (noManualPitchRoll) {
        const droneRotForAutoLevel = droneBody.rotation();
        const droneQuaternionTHREE = new THREE.Quaternion(
          droneRotForAutoLevel.x,
          droneRotForAutoLevel.y,
          droneRotForAutoLevel.z,
          droneRotForAutoLevel.w,
        );
        const euler = new THREE.Euler().setFromQuaternion(
          droneQuaternionTHREE,
          "YXZ",
        );

        const currentPitch = euler.x;
        const currentRoll = euler.z;

        const correctivePitch = currentPitch * config.autoLevelPitchGain;
        finalPitchTorque += correctivePitch;

        const correctiveRoll = -currentRoll * config.autoLevelRollGain;
        finalRollTorque += correctiveRoll;
      }

      const localTorque = new THREE.Vector3(
        finalPitchTorque,
        finalYawTorque,
        finalRollTorque,
      );
      const worldTorque = localTorque.clone().applyQuaternion(quaternion);

      droneBody.addTorque(
        {
          x: worldTorque.x,
          y: worldTorque.y,
          z: worldTorque.z,
        },
        true,
      );

      level.world.step();

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

    updateHUD({
      batteryLevel,
      controls,
      droneBody,
      droneMesh,
    });

    // spin propellers based on throttle
    for (const prop of propellers) {
      prop.rotation.y += controls.throttle * 20 * deltaTime;
    }

    // cameras

    level.fpvCamera.position.set(dronePos.x, dronePos.y, dronePos.z);
    level.fpvCamera.quaternion.set(
      droneRot.x,
      droneRot.y,
      droneRot.z,
      droneRot.w,
    );

    level.chaseCamera.position.set(dronePos.x, dronePos.y + 2, dronePos.z + 3);
    level.chaseCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);

    level.topCamera.position.set(dronePos.x, 10, dronePos.z);
    level.topCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);

    // ---------------------------------------------------------------------------
    // render scene
    // ---------------------------------------------------------------------------

    level.renderer.render(level.scene, level.currentCamera);
  }

  update();
}

main();
