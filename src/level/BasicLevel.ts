import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import * as config from "../config";
import Level from "./Level";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createTank } from "../environment/tank";
import { createTU95 } from "../environment/tu95";
import { createBarrier } from "../environment/barrier";

export default class BasicLevel extends Level {
  fpvCamera: THREE.PerspectiveCamera;
  chaseCamera: THREE.PerspectiveCamera;
  topCamera: THREE.PerspectiveCamera;
  private propellers: THREE.Object3D[] = [];
  /**
   * the currently active camera that is being rendered from
   */
  currentCamera: THREE.PerspectiveCamera;

  isPaused: boolean = false;

  batteryLevel: number;

  windVector: THREE.Vector3;
  targetWindVector: THREE.Vector3;
  windChangeTimer: number;
  windChangeInterval: number;

  drone: {
    body: RAPIER.RigidBody;
    group: THREE.Group;
  };

  pingDelay: number; // milliseconds
  inputBuffer: Array<{
    timestamp: number;
    controls: {
      throttle: number;
      pitch: number;
      roll: number;
      yaw: number;
    };
  }>;
  pingChangeTimer: number;
  pingChangeInterval: number; // seconds between ping changes

  temperature: number;
  targetTemperature: number;
  temperatureChangeTimer: number;
  temperatureChangeInterval: number;

  motorSpeeds: number[] = [0, 0, 0, 0];

  constructor() {
    super();
    console.log("[BasicLevel.constructor]");

    // cameras

    this.fpvCamera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    this.fpvCamera.position.set(0, 1, 0);

    this.chaseCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    this.topCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );

    this.currentCamera = this.fpvCamera;

    // battery
    this.batteryLevel = 100;

    // wind
    this.windVector = new THREE.Vector3(0, 0, 0);
    this.targetWindVector = new THREE.Vector3(0, 0, 0);
    this.windChangeTimer = 0;
    this.windChangeInterval = 8; // seconds between wind target changes

    // temperature
    this.temperature = 70; // Starting at 70°F
    this.targetTemperature = 70;
    this.temperatureChangeTimer = 0;
    this.temperatureChangeInterval = 10; // seconds between temperature changes

    // ping delay
    this.pingDelay = Math.random() * 50 + 50; // 50-100ms
    this.inputBuffer = [];
    this.pingChangeTimer = 0;
    this.pingChangeInterval = 3; // change ping every 3 seconds

    // create stuff
    this.drone = this.createDrone();
    this.createLighting();
    this.createFloor();
    this.createSkybox();
    this.createPauseMenu();
    createTU95(this.scene, this.world, new THREE.Vector3(15, 5, 5));
  }

  createSkybox() {
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

    this.scene.background = skybox; // shows in the backdrop
    this.scene.environment = skybox; // lets reflective materials pick it up
  }

  createFloor() {
    const floorSize = 10000;
    const floorTexture = this.textureLoader.load("/floor.png");
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
    this.scene.add(floor);
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        floorSize / 2,
        0.1,
        floorSize / 2,
      ).setTranslation(0, -0.1, 0),
    );
  }

  createLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemiLight);

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
    this.scene.add(directionalLight);

    // Additional point lights to softly illuminate the this.scene
    const pointLight1 = new THREE.PointLight(0xffffff, 0.6);
    pointLight1.position.set(5, 3, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.6);
    pointLight2.position.set(-5, 3, -5);
    this.scene.add(pointLight2);
  }

  createPauseMenu() {
    const pauseContainer = document.createElement("div");
    pauseContainer.id = "pause-menu";
    pauseContainer.style.display = "none";
    pauseContainer.innerHTML = `
      <div class="pause-content">
        <h1>PAUSED</h1>
        <button id="resume-button">RESUME</button>
        <div id="pause-hud"></div>
      </div>
    `;
    document.body.appendChild(pauseContainer);

    const pauseStyle = document.createElement("style");
    pauseStyle.textContent = `

    `;
    document.head.appendChild(pauseStyle);

    document.getElementById("resume-button")!.addEventListener("click", () => {
      this.togglePause();
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseMenu = document.getElementById("pause-menu")!;

    if (this.isPaused) {
      pauseMenu.style.display = "flex";
    } else {
      pauseMenu.style.display = "none";
    }
  }

  createDrone() {
    const droneGroup = new THREE.Group();
    this.scene.add(droneGroup);

    const droneBody = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0.0, 1.0, -2.0)
        .setLinvel(0.0, 0.0, 0.0)
        .setAngvel(new THREE.Vector3(0.0, 0.0, 0.0))
        .setCcdEnabled(true),
    );

    const droneCol = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.52, 0.075, 0.52)
        .setMass(config.droneMass)
        .setRestitution(0.2)
        .setFriction(0.5),
      droneBody,
    );

    return { body: droneBody, group: droneGroup };
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log("[BasicLevel.initialize]");

    // load drone
    {
      const loader = new GLTFLoader();
      const model = await loader.loadAsync("/models/gltf/lowpolydrone.gltf");
      const modelClone = model.scene.clone();
      modelClone.scale.set(0.01, 0.01, 0.01);
      this.drone.group.add(modelClone);

      // Enable shadows for all meshes in the model
      this.drone.group.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // ─── Store references to the 4 wing meshes so we can spin them ───
      modelClone.traverse((child: THREE.Object3D) => {
        // Wing nodes are named "Wing1", "Wing2", … in this GLTF
        if (child.name.startsWith("Wing")) {
          this.propellers.push(child);
        }
      });
    }
  }

  update(deltaTime: number): void {
    // Handle ESC key for pause
    if (this.keys["escape"]) {
      this.togglePause();
      this.keys["escape"] = false; // Prevent multiple toggles
    }

    if (!this.isPaused) {
      super.update(deltaTime);
      this.updateControls(deltaTime);
      this.updateWind(deltaTime);
      this.updateTemperature(deltaTime);
      this.updatePing(deltaTime);
      this.updateBattery(deltaTime);
      this.updatePhysics(deltaTime);
      this.updateGraphics(deltaTime);
      this.updateHUD(deltaTime);
    }

    this.renderer.render(this.scene, this.currentCamera);
  }

  updatePhysics(deltaTime: number): void {
    while (this.accumulator >= this.world.timestep) {
      // Reset forces
      this.drone.body.resetForces(true);
      this.drone.body.resetTorques(true);

      // Calculate thrust
      const thrustMagnitude =
        this.batteryLevel > 0 ? this.controls.throttle * config.maxThrust : 0;
      const rotation = this.drone.body.rotation();

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
      this.drone.body.addForce(thrustVector, true);

      /// Apply wind velocity
      const currentVel = this.drone.body.linvel();
      this.drone.body.setLinvel(
        {
          x: currentVel.x + this.windVector.x * deltaTime,
          y: currentVel.y,
          z: currentVel.z + this.windVector.z * deltaTime,
        },
        true,
      );

      let finalPitchTorque = this.controls.pitch * config.maxPitchTorque;
      let finalRollTorque = -this.controls.roll * config.maxRollTorque;
      let finalYawTorque = this.controls.yaw * config.maxYawTorque;

      const noManualPitchRoll =
        this.targetControls.pitch === 0 && this.targetControls.roll === 0;

      if (noManualPitchRoll) {
        const droneRotForAutoLevel = this.drone.body.rotation();
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

        const correctivePitch = -currentPitch * config.autoLevelPitchGain;
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

      this.drone.body.addTorque(
        {
          x: worldTorque.x,
          y: worldTorque.y,
          z: worldTorque.z,
        },
        true,
      );

      this.world.step();
      this.accumulator -= this.world.timestep;
    }
  }

  updateControls(deltaTime: number) {
    const throttleSpeed = 1.0;
    const currentTime = performance.now();

    // Create new control input based on current keys
    const newControls = {
      throttle: this.targetControls.throttle,
      pitch: 0,
      roll: 0,
      yaw: 0,
    };

    // Throttle (up/down arrows)
    if (this.keys["arrowup"]) {
      newControls.throttle = Math.min(
        1,
        this.targetControls.throttle + throttleSpeed * deltaTime,
      );
    } else if (this.keys["arrowdown"]) {
      newControls.throttle = Math.max(
        0,
        this.targetControls.throttle - throttleSpeed * deltaTime,
      );
    } else {
      newControls.throttle = config.hoverThrottle;
    }

    // Pitch (W/S)
    if (this.keys["w"]) newControls.pitch = -1;
    if (this.keys["s"]) newControls.pitch = 1;

    // Roll (A/D)
    if (this.keys["a"]) newControls.roll = -1;
    if (this.keys["d"]) newControls.roll = 1;

    // Yaw (Q/E)
    if (this.keys["q"]) newControls.yaw = -1;
    if (this.keys["e"]) newControls.yaw = 1;

    // Add to input buffer with timestamp
    this.inputBuffer.push({
      timestamp: currentTime,
      controls: { ...newControls },
    });

    // Process delayed inputs
    while (
      this.inputBuffer.length > 0 &&
      currentTime - this.inputBuffer[0].timestamp >= this.pingDelay
    ) {
      const delayedInput = this.inputBuffer.shift()!;
      this.targetControls = delayedInput.controls;
    }

    // Reset position (immediate, no delay)
    if (this.keys["r"]) {
      this.drone.body.setTranslation({ x: 0, y: 1, z: 0 }, true);
      this.drone.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      this.drone.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      this.drone.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.batteryLevel = 100;
    }

    // Super battery drain (immediate)
    if (this.keys["b"]) {
      this.batteryLevel = 2;
    }

    // Camera switching (immediate)
    if (this.keys["1"]) {
      console.log("Switching to FPV camera");
      this.currentCamera = this.fpvCamera;
    }
    if (this.keys["2"]) {
      console.log("Switching to chase camera");
      this.currentCamera = this.chaseCamera;
    }
    if (this.keys["3"]) {
      console.log("Switching to top camera");
      this.currentCamera = this.topCamera;
    }

    // Smooth control inputs
    const controlSmoothing = 5.0;
    this.controls.throttle +=
      (this.targetControls.throttle - this.controls.throttle) *
      controlSmoothing *
      deltaTime;
    this.controls.pitch +=
      (this.targetControls.pitch - this.controls.pitch) *
      controlSmoothing *
      deltaTime;
    this.controls.roll +=
      (this.targetControls.roll - this.controls.roll) *
      controlSmoothing *
      deltaTime;
    this.controls.yaw +=
      (this.targetControls.yaw - this.controls.yaw) *
      controlSmoothing *
      deltaTime;
  }

  updateWind(deltaTime: number): void {
    this.windChangeTimer += deltaTime;

    if (this.windChangeTimer >= this.windChangeInterval) {
      // Generate new gentle wind target
      const windSpeed = Math.random() * 1 + 0;
      const windAngle = Math.random() * Math.PI * 2; // random direction

      this.targetWindVector.set(
        Math.cos(windAngle) * windSpeed,
        0,
        Math.sin(windAngle) * windSpeed,
      );

      this.windChangeTimer = 0;
    }

    // Smoothly interpolate current wind towards target
    const windSmoothing = 0.3;
    this.windVector.lerp(this.targetWindVector, windSmoothing * deltaTime);
  }

  updateTemperature(deltaTime: number): void {
    this.temperatureChangeTimer += deltaTime;

    if (this.temperatureChangeTimer >= this.temperatureChangeInterval) {
      // Generate new temperature target between 50°F and 90°F
      this.targetTemperature = 50 + Math.random() * 20;
      this.temperatureChangeTimer = 0;
    }

    // Smoothly interpolate current temperature towards target
    const tempSmoothing = 0.05;
    this.temperature +=
      (this.targetTemperature - this.temperature) * tempSmoothing * deltaTime;
  }

  updatePing(deltaTime: number): void {
    this.pingChangeTimer += deltaTime;

    if (this.pingChangeTimer >= this.pingChangeInterval) {
      // Generate new ping value between 50-100ms
      this.pingDelay = Math.random() * 50 + 50;
      this.pingChangeTimer = 0;
    }
  }

  updateBattery(deltaTime: number): void {
    const throttleSquared = this.controls.throttle * this.controls.throttle;
    const drainRate =
      (100 / config.maxFlightTime) * (0.5 + throttleSquared * 1.5); // Base drain + throttle-based drain
    this.batteryLevel = Math.max(0, this.batteryLevel - drainRate * deltaTime);
  }

  updateHUD(deltaTime: number) {
    const vel = this.drone.body.linvel();
    const totalVelocity = Math.sqrt(
      vel.x * vel.x + vel.y * vel.y + vel.z * vel.z,
    );
    const groundSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    // battery
    document.getElementById("battery")!.textContent =
      `${Math.floor(this.batteryLevel)}%`;
    // Battery color based on level
    const batteryElement = document.getElementById("battery")!;
    if (this.batteryLevel > 30) {
      batteryElement.style.color = "#00ff00";
    } else if (this.batteryLevel > 15) {
      batteryElement.style.color = "#ffaa00";
    } else {
      batteryElement.style.color = "#ff0000";
    }
    // Convert quaternion to euler angles
    const euler = new THREE.Euler();
    euler.setFromQuaternion(this.drone.group.quaternion);
    const pitch = THREE.MathUtils.radToDeg(euler.x);
    const yaw = THREE.MathUtils.radToDeg(euler.y);
    const roll = THREE.MathUtils.radToDeg(euler.z);
    document.getElementById("pitch")!.textContent = `${pitch.toFixed(1)}°`;
    document.getElementById("roll")!.textContent = `${roll.toFixed(1)}°`;
    document.getElementById("yaw")!.textContent = `${yaw.toFixed(1)}°`;
    document.getElementById("velocity")!.textContent =
      `${totalVelocity.toFixed(1)} m/s`;
    document.getElementById("groundspeed")!.textContent =
      `${groundSpeed.toFixed(1)} m/s`;

    // Wind
    const windSpeed = Math.sqrt(
      this.windVector.x * this.windVector.x +
        this.windVector.z * this.windVector.z,
    );
    const windDirection =
      (Math.atan2(this.windVector.z, this.windVector.x) * 180) / Math.PI;
    const normalizedWindDir =
      windDirection < 0 ? windDirection + 360 : windDirection;

    // Ping
    document.getElementById("ping")!.textContent =
      `${Math.round(this.pingDelay)} ms`;

    document.getElementById("windspeed")!.textContent =
      `${windSpeed.toFixed(1)} m/s`;
    document.getElementById("winddir")!.textContent =
      `${normalizedWindDir.toFixed(0)}°`;

    // Temperature
    document.getElementById("temperature")!.textContent =
      `${Math.round(this.temperature)}°F`;

    // Update motor thrust bars
    // Calculate motor speeds based on control inputs (same mixing as propellers)
    const base = this.controls.throttle;
    const pitchGain = 0.3;
    const rollGain = 0.3;
    const yawGain = 0.2;

    // Motor positions: FL (0), FR (1), BL (2), BR (3)
    this.motorSpeeds[0] =
      base +
      this.controls.pitch * pitchGain -
      this.controls.roll * rollGain +
      this.controls.yaw * yawGain; // FL
    this.motorSpeeds[1] =
      base +
      this.controls.pitch * pitchGain +
      this.controls.roll * rollGain -
      this.controls.yaw * yawGain; // FR
    this.motorSpeeds[2] =
      base -
      this.controls.pitch * pitchGain -
      this.controls.roll * rollGain -
      this.controls.yaw * yawGain; // BL
    this.motorSpeeds[3] =
      base -
      this.controls.pitch * pitchGain +
      this.controls.roll * rollGain +
      this.controls.yaw * yawGain; // BR

    // Update visual bars
    this.motorSpeeds.forEach((speed, i) => {
      const motorBar = document.getElementById(`motor${i}`)!;
      const clampedSpeed = Math.max(0, Math.min(1, speed));
      motorBar.style.background = `linear-gradient(to top, #00ff00 ${clampedSpeed * 100}%, rgba(0, 255, 0, 0.2) ${clampedSpeed * 100}%)`;
    });
  }

  updateGraphics(deltaTime: number): void {
    // drone
    const dronePos = this.drone.body.translation();
    const droneRot = this.drone.body.rotation();
    this.drone.group.position.set(dronePos.x, dronePos.y, dronePos.z);
    this.drone.group.quaternion.set(
      droneRot.x,
      droneRot.y,
      droneRot.z,
      droneRot.w,
    );

    // ─── Spin propellers with throttle + full mixer (pitch / roll / yaw), stop at 0 battery ───
    if (this.batteryLevel > 0) {
      const base = this.controls.throttle * 20; // rad·s⁻¹ at full throttle
      const pitchGain = 10;
      const rollGain = 10;
      const yawGain = 15;

      this.propellers.forEach((prop, i) => {
        // Get propeller position in drone's local space
        const worldPos = new THREE.Vector3();
        prop.getWorldPosition(worldPos);
        const droneWorldPos = new THREE.Vector3();
        this.drone.group.getWorldPosition(droneWorldPos);
        const droneWorldQuat = new THREE.Quaternion();
        this.drone.group.getWorldQuaternion(droneWorldQuat);

        // Transform to drone's local space
        const localPos = worldPos.sub(droneWorldPos);
        localPos.applyQuaternion(droneWorldQuat.conjugate());

        const frontDir = localPos.z < 0 ? -1 : 1; // -1 front, +1 back
        const rightDir = localPos.x > 0 ? 1 : -1; // +1 right, -1 left
        const yawDir = (i & 1) === 0 ? 1 : -1; // CW / CCW rotor pair

        const speed =
          base +
          this.controls.pitch * pitchGain * -frontDir + // pitch: front vs back
          this.controls.roll * rollGain * -rightDir + // roll: left vs right (inverted)
          this.controls.yaw * yawGain * yawDir; // yaw: CW vs CCW

        prop.rotation.z += speed * deltaTime; // rotate about local Z
      });
    }

    // cameras

    // Position FPV camera 0.3 units above the drone in its local up direction
    const localUp = new THREE.Vector3(0, 1, 0);
    const droneQuaternion = new THREE.Quaternion(
      droneRot.x,
      droneRot.y,
      droneRot.z,
      droneRot.w,
    );
    const worldUp = localUp.clone().applyQuaternion(droneQuaternion);
    const cameraOffset = worldUp.multiplyScalar(0.3);
    this.fpvCamera.position.set(
      dronePos.x + cameraOffset.x,
      dronePos.y + cameraOffset.y,
      dronePos.z + cameraOffset.z,
    );
    this.fpvCamera.quaternion.set(
      droneRot.x,
      droneRot.y,
      droneRot.z,
      droneRot.w,
    );

    this.chaseCamera.position.set(dronePos.x, dronePos.y + 2, dronePos.z + 3);
    this.chaseCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);

    this.topCamera.position.set(dronePos.x, 10, dronePos.z);
    this.topCamera.lookAt(dronePos.x, dronePos.y, dronePos.z);
  }
}
function createLowPolyDrone(scene: any, world: any, arg2: THREE.Vector3) {
  throw new Error("Function not implemented.");
}
