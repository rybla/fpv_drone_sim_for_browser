import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import * as config from "../config";
import { createBarrels } from "../environment/barrels";
import { createCheckpoint, type Checkpoint } from "../environment/checkpoint";
import { createCoffeeTable } from "../environment/coffeeTable";
import { createEndpoint } from "../environment/endpoint";
import { createFan } from "../environment/fan";
import { createGrenadeCrate } from "../environment/grenadeCrate";
import { createMarbleTable } from "../environment/marbleTable";
import { createMedicalKit } from "../environment/medicalKit";
import { createMetalBarrel } from "../environment/metalBarrel";
import { createNanodrone } from "../environment/nanodrone";
import { createStartpoint } from "../environment/startpoint";
import { createTU96 } from "../environment/tu95";
import { createWoodenChair } from "../environment/woodenChair";
import { createWoodenRoomDivider } from "../environment/woodenRoomDivider";
import { createWoodenTable } from "../environment/woodenTable";
import type { LocationId, ObjectId, Spec } from "../spec";
import { createMansion } from "../environment/mansion";

export type Controls = {
  throttle: number;
  pitch: number;
  roll: number;
  yaw: number;
};

export type Drone = {
  body: RAPIER.RigidBody;
  group: THREE.Group;
  propellers: THREE.Object3D[];
  collider: RAPIER.Collider;
};

export const locationVectors: { [key in LocationId]: THREE.Vector3 } = {
  "bottom corner of corner room with stairs": new THREE.Vector3(-3.4, 1.0, 0.1),
  "base of stairs of corner room with stairs": new THREE.Vector3(
    17.0,
    1.2,
    -9.2,
  ),
  "middle flight of corner room with stairs": new THREE.Vector3(
    10.1,
    13.0,
    -27.9,
  ),
  "top of stairs of corner room with stairs": new THREE.Vector3(
    0.2,
    19.1,
    -3.4,
  ),
  "corner entrance of long bottom room": new THREE.Vector3(26.6, 1.0, -6.7),
  "middle of long bottom room": new THREE.Vector3(35.8, 5.2, -15.3),
  "facing archway door of small corner room": new THREE.Vector3(
    74.7,
    3.7,
    -1.3,
  ),
  "dark side of light and dark room": new THREE.Vector3(51.5, 32, -22.7),
  "light side of light and dark room": new THREE.Vector3(83.4, 2.5, -21.8),
  "in corner of checker corner room": new THREE.Vector3(78.1, 3.0, -52.0),
  "archway into light and dark room of checker corner room": new THREE.Vector3(
    74.9,
    2.1,
    -38.2,
  ),
  "base of stairs of main stairway": new THREE.Vector3(49.7, 1.7, -39.1),
  "middle flight of main stairway": new THREE.Vector3(28.2, 10.6, -33.9),
  "top flight of main stairway": new THREE.Vector3(47.5, 22.0, -30.7),
  "sky light of main stairway": new THREE.Vector3(40.2, 30.6, -34.8),
  "middle of small boring room": new THREE.Vector3(53.0, 4.2, -51.3),
  "middle of tile bathroom": new THREE.Vector3(31.9, 10.7, -53.1),
  "middle of top boring room": new THREE.Vector3(50.7, 21.8, -51.8),
  "corner of top light room": new THREE.Vector3(80.5, 19.9, -56.4),
  "doorway of top light room": new THREE.Vector3(66.1, 18.8, -42.2),
  "by stairs of top hallway": new THREE.Vector3(58.7, 18.5, -36.1),
  "by narrow door room of top hallway": new THREE.Vector3(58.9, 18.4, -4.1),
  "middle of hallway of top hallway": new THREE.Vector3(37.1, 19.7, -2.3),
  "by window of top big light room": new THREE.Vector3(85.6, 18.1, -22.4),
  "by door of top big light room": new THREE.Vector3(65.8, 19.7, -23.9),
  "back of room of tight doorway room": new THREE.Vector3(74.9, 17.0, -3.3),
  "by tight door of tight doorway room": new THREE.Vector3(65.3, 20.9, -7.5),
};

export const objectCreators: {
  [key in ObjectId]: (level: Level, pos: THREE.Vector3) => Promise<void>;
} = {
  barrels: createBarrels,
  coffeeTable: createCoffeeTable,
  fan: createFan,
  grenadeCrate: createGrenadeCrate,
  marbleTable: createMarbleTable,
  medicalKit: createMedicalKit,
  metalBarrel: createMetalBarrel,
  tu95: createTU96,
  woodenChair: createWoodenChair,
  woodenRoomDivider: createWoodenRoomDivider,
  woodenTable: createWoodenTable,
};

export default class Level {
  spec: Spec;

  world: RAPIER.World;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  textureLoader: THREE.TextureLoader;

  /**
   * for each key, whether or not it's currently being held down
   */
  keys: { [key: string]: boolean };

  controls: Controls;
  targetControls: Controls;

  clock: THREE.Clock;
  accumulator: number;

  drone?: Drone;

  isPaused: boolean = false;

  camera?: THREE.Camera;

  fpvCamera: THREE.PerspectiveCamera;
  chaseCamera: THREE.PerspectiveCamera;
  topCamera: THREE.PerspectiveCamera;

  batteryLevel: number;

  windVector: THREE.Vector3;
  targetWindVector: THREE.Vector3;
  windChangeTimer: number;
  windChangeInterval: number;

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

  environmentTemperature: number;
  targetEnvironmentTemperature: number;
  environmentTemperatureChangeTimer: number;
  environmentTemperatureChangeInterval: number;

  motorSpeeds: number[] = [0, 0, 0, 0];

  targetAltitude: number = 1;

  targetPosition: THREE.Vector3 = new THREE.Vector3();

  checkpoints: Checkpoint[] = [];

  // Settings
  settings = {
    fov: 115,
    windEnabled: false,
    pingEnabled: true,
    temperatureMin: 50,
    temperatureMax: 90,
    pitchSensitivity: 1.0,
    rollSensitivity: 1.0,
    yawSensitivity: 1.0,
    autoLevelStrength: 1.0,
    autoLevelEnabled: true,
    batteryDrainMultiplier: 1.0,
    infiniteBattery: false,
    showCoordinates: false,
    videoInterferenceEnabled: false,
  };

  videoInterferenceQuad?: THREE.Mesh;
  videoInterferenceMaterial?: THREE.ShaderMaterial;
  interferenceTimer: number = 0;
  interferenceActive: boolean = false;
  nextInterferenceTime: number = 0;

  lateralTuning = {
    maxAccel: 12, // horizontal accel cap  (m s⁻²)
    brakeAccel: 30, // decel used for braking (m s⁻²)
    earlyBrakeFactor: 1.0, // >1 ⇒ start braking sooner
    w: 1.5, // natural freq. near hover (rad s⁻¹)
    zeta: 4.0, // damping ratio (>1 overdamped)
  };

  constructor(spec_: Spec) {
    console.log("[Level.constructor]");

    this.spec = spec_;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    this.textureLoader = new THREE.TextureLoader();

    this.keys = {};

    this.controls = {
      throttle: config.hoverThrottle,
      pitch: 0,
      roll: 0,
      yaw: 0,
    };
    this.targetControls = { ...this.controls };

    // clock
    this.clock = new THREE.Clock();
    this.accumulator = 0;
    this.world.timestep = 1 / 60;

    // cameras

    this.fpvCamera = new THREE.PerspectiveCamera(
      115,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    this.fpvCamera.position.set(0, 1, 0);

    // Apply initial FOV setting
    this.fpvCamera.fov = this.settings.fov;
    this.fpvCamera.updateProjectionMatrix();

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

    this.camera = this.fpvCamera;

    // battery
    this.batteryLevel = 100;
    this.targetAltitude = 1;
    this.targetPosition.set(0, 0, 0);

    // wind
    this.windVector = new THREE.Vector3(0, 0, 0);
    this.targetWindVector = new THREE.Vector3(0, 0, 0);
    this.windChangeTimer = 0;
    this.windChangeInterval = 8; // seconds between wind target changes
    // FROM SPEC: set windEnabled
    this.settings.windEnabled = this.spec.windEnabled;

    // temperature
    // this.environmentTemperature = 70; // Starting at 70°F
    // FROM SPEC: set environmentTemperature
    this.environmentTemperature = this.spec.environmentTemperature;
    this.targetEnvironmentTemperature = 70;
    this.environmentTemperatureChangeTimer = 0;
    this.environmentTemperatureChangeInterval = 10; // seconds between temperature changes

    // ping delay
    // this.pingDelay = Math.random() * 50 + 50; // 50-100ms
    // FROM SPEC: set pingDelay
    this.pingDelay = this.spec.pingDelay;
    this.inputBuffer = [];
    this.pingChangeTimer = 0;
    this.pingChangeInterval = 3; // change ping every 3 seconds

    // create stuff
    this.createLighting();
    // this.createFloor();
    this.createSkybox();
  }

  createSkybox() {
    const cubeTextureLoader = new THREE.CubeTextureLoader();

    // const skybox = cubeTextureLoader
    //   .setPath("/")
    //   .load([
    //     "nightsky_rt.png",
    //     "nightsky_lf.png",
    //     "nightsky_up.png",
    //     "nightsky_dn.png",
    //     "nightsky_bk.png",
    //     "nightsky_ft.png",
    //   ]);

    const skybox = cubeTextureLoader
      .setPath("/")
      .load([
        "xpos.png",
        "xneg.png",
        "ypos.png",
        "yneg.png",
        "zpos.png",
        "zneg.png",
      ]);

    this.scene.background = skybox; // shows in the backdrop
    this.scene.environment = skybox; // lets reflective materials pick it up
  }

  createVideoInterference() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform float intensity;
      varying vec2 vUv;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = vUv;

        // Horizontal scan lines
        float scanline = sin(uv.y * 800.0 + time * 10.0) * 0.04;
        uv.y += scanline * intensity;

        // Random noise
        float noise = random(uv + time) * 0.1;

        // Color distortion
        float r = random(vec2(time * 0.1, uv.y));
        float g = random(vec2(time * 0.2, uv.y));
        float b = random(vec2(time * 0.3, uv.y));

        vec3 color = vec3(r, g, b) * noise * intensity;

        // Glitch blocks
        float blockNoise = step(0.99, random(floor(uv * 10.0) + time));
        color += vec3(blockNoise) * intensity;

        gl_FragColor = vec4(color, intensity * 0.3);
      }
    `;

    this.videoInterferenceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.videoInterferenceQuad = new THREE.Mesh(
      geometry,
      this.videoInterferenceMaterial,
    );
    this.videoInterferenceQuad.frustumCulled = false;
    this.videoInterferenceQuad.renderOrder = 999;
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
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      0.4 * this.spec.lightingLevel,
    );
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      0xffffff,
      0x444444,
      0.6 * this.spec.lightingLevel,
    );
    this.scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.0 * this.spec.lightingLevel,
    );
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
    const pointLight1 = new THREE.PointLight(
      0xffffff,
      0.6 * this.spec.lightingLevel,
    );
    pointLight1.position.set(5, 3, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(
      0xffffff,
      0.6 * this.spec.lightingLevel,
    );
    pointLight2.position.set(-5, 3, -5);
    this.scene.add(pointLight2);
  }

  async initialize(): Promise<void> {
    console.log("[Level.initialize]");
    // Input handling
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    document.getElementById("resume-button")!.addEventListener("click", () => {
      this.togglePause();
    });

    this.createVideoInterference();

    this.drone = await createNanodrone(this);
    // FROM SPEC: set drone's position to start position
    const startpointVector = locationVectors[this.spec.startpoint_locationId];
    this.drone.body.setTranslation(
      new RAPIER.Vector3(
        startpointVector.x,
        startpointVector.y,
        startpointVector.z,
      ),
      true,
    );
    const startPos = this.drone.body.translation();
    this.targetPosition.set(startPos.x, 0, startPos.z);
    this.targetAltitude = startPos.y;

    await createMansion(this, new THREE.Vector3(1, 0.2, 1));

    this.setupSettingsMenu();

    // FROM SPEC: startpoint
    createStartpoint(this, startpointVector);

    // FROM SPEC: endpoint
    const endpointVector = locationVectors[this.spec.endpoint_locationId];
    createEndpoint(this, endpointVector);

    // FROM SPEC: checkpoints
    for (const locationId of this.spec.checkpoint_locationIds) {
      this.checkpoints.push(
        createCheckpoint(this, locationVectors[locationId]),
      );
    }

    // FROM SPEC: create objects
    for (const o of this.spec.objects) {
      await objectCreators[o.objectId](this, locationVectors[o.locationId]);
    }
  }

  start(): void {
    const level = this;

    function loop() {
      requestAnimationFrame(loop);
      const deltaTime = Math.min(level.clock.getDelta(), 0.1);
      level.accumulator += deltaTime;
      level.update(deltaTime);
    }

    loop();
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

  update(deltaTime: number): void {
    // Handle ESC key for pause
    if (this.keys["escape"]) {
      this.togglePause();
      this.keys["escape"] = false; // Prevent multiple toggles
    }

    if (this.isPaused) {
      this.updateAlways(deltaTime);
    } else {
      this.updateBeforeRender(deltaTime);
      if (this.camera) this.renderer.render(this.scene, this.camera);
      this.updateAfterRender(deltaTime);
    }
  }

  updateAlways(_deltaTime: number): void {}

  updateBeforeRender(deltaTime: number): void {
    this.updateControls(deltaTime);
    this.updateWind(deltaTime);
    this.updateTemperature(deltaTime);
    this.updatePing(deltaTime);
    this.updateBattery(deltaTime);
    this.updatePhysics(deltaTime);
    this.updateCheckpoints();
    this.updateGraphics(deltaTime);
    this.updateHUD(deltaTime);
    this.updateVideoInterference(deltaTime);
  }

  updateAfterRender(_deltaTime: number): void {}

  updatePhysics(deltaTime: number): void {
    while (this.accumulator >= this.world.timestep) {
      // Reset forces
      this.drone!.body.resetForces(true);
      this.drone!.body.resetTorques(true);

      // Adjust for air density changes caused by temperature
      const standardTempK = 288.15; // 15°C in Kelvin
      const envTempK = (this.environmentTemperature - 32) * (5 / 9) + 273.15;
      const airDensityFactor = standardTempK / envTempK;

      const rotation = this.drone!.body.rotation();
      const quaternion = new THREE.Quaternion(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w,
      );

      const euler = new THREE.Euler().setFromQuaternion(quaternion, "YXZ");
      const angVel = this.drone!.body.angvel();

      const maxTilt = THREE.MathUtils.degToRad(10);

      let desiredPitch =
        THREE.MathUtils.clamp(
          this.controls.pitch * this.settings.pitchSensitivity,
          -1,
          1,
        ) * maxTilt;

      let desiredRoll =
        THREE.MathUtils.clamp(
          -this.controls.roll * this.settings.rollSensitivity,
          -1,
          1,
        ) * maxTilt;

      // ─── Lateral position hold — early-braking predictive controller ───
      if (this.targetControls.pitch === 0 && this.targetControls.roll === 0) {
        const pos = this.drone!.body.translation();
        const vel = this.drone!.body.linvel();

        const errorX = this.targetPosition.x - pos.x;
        const errorZ = this.targetPosition.z - pos.z;

        // Transform world errors into drone's local frame
        const worldError = new THREE.Vector3(errorX, 0, errorZ);
        const inverseQuat = quaternion.clone().conjugate();
        const localError = worldError.applyQuaternion(inverseQuat);

        // Transform world velocity into drone's local frame
        const worldVel = new THREE.Vector3(vel.x, 0, vel.z);
        const localVel = worldVel.applyQuaternion(inverseQuat);

        const {
          maxAccel,
          brakeAccel,
          earlyBrakeFactor: _earlyBrakeFactor,
          w,
          zeta: _zeta,
        } = this.lateralTuning;

        const computeAxis = (error: number, v: number): number => {
          const speed = Math.abs(v);
          const speedFactor = Math.min(2, speed / 5);
          const dynamicBrake = brakeAccel * (1 + speedFactor);

          const stoppingDist = (v * v) / (2 * dynamicBrake);
          const movingToward = error * v > 0;

          // Stop braking earlier to prevent overshoot
          const earlyStopFactor = 0.3 - Math.min(0.2, speed / 20);
          if (
            movingToward &&
            stoppingDist >= Math.abs(error) * earlyStopFactor
          ) {
            // Taper off braking force as velocity approaches zero
            const velocityTaper = Math.min(1, speed / 2);
            return -Math.sign(v) * dynamicBrake * velocityTaper;
          }

          // Prevent oscillation - if moving away from target at low speed, apply strong damping
          if (!movingToward && speed < 2.0) {
            return -Math.sign(v) * Math.min(maxAccel * 2, speed * 10);
          }

          // Normal correction with velocity-dependent damping
          const errorFactor = Math.min(1, Math.abs(error) / 3);
          const velocityDamping = 2 + 3 / (1 + speed); // More damping at low speeds
          return THREE.MathUtils.clamp(
            w * w * error * errorFactor - velocityDamping * w * v,
            -maxAccel,
            maxAccel,
          );
        };

        const accX = computeAxis(localError.x, localVel.x);
        const accZ = computeAxis(localError.z, localVel.z);

        // Scale max tilt based on velocity - level off when velocity is near zero
        const groundSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

        const speedFactor = Math.min(1, groundSpeed / 5);
        const maxBrakeTilt = THREE.MathUtils.degToRad(10 + speedFactor * 25);

        desiredRoll +=
          THREE.MathUtils.clamp(-accX / 9.81, -1, 1) * maxBrakeTilt;
        desiredPitch +=
          THREE.MathUtils.clamp(accZ / 9.81, -1, 1) * maxBrakeTilt;
      }

      // const pitchError = desiredPitch - euler.x;
      // const rollError = desiredRoll - euler.z;

      // Detect extreme angles and increase gains for recovery
      const currentTilt = Math.sqrt(euler.x * euler.x + euler.z * euler.z);
      const extremeTiltThreshold = THREE.MathUtils.degToRad(20);
      const gainMultiplier = currentTilt > extremeTiltThreshold ? 2.0 : 1.0;

      // Apply auto-level settings
      const autoLevelFactor = this.settings.autoLevelEnabled
        ? this.settings.autoLevelStrength
        : 0;
      const effectiveDesiredPitch = desiredPitch;
      const effectiveDesiredRoll = desiredRoll;

      // Calculate stabilization in body frame to avoid yaw coupling
      const bodyAngVel = new THREE.Vector3(angVel.x, angVel.y, angVel.z);
      const invQuat = quaternion.clone().conjugate();
      bodyAngVel.applyQuaternion(invQuat);

      const effectivePitchError = effectiveDesiredPitch - euler.x;
      const effectiveRollError = effectiveDesiredRoll - euler.z;

      const angleKp = 80.0 * gainMultiplier * (1 + autoLevelFactor);
      const angleKd = 20.0 * gainMultiplier * (1 + autoLevelFactor * 0.5);

      // Apply corrections in body frame
      let finalPitchTorque =
        THREE.MathUtils.clamp(
          angleKp * effectivePitchError - angleKd * bodyAngVel.x,
          -1,
          1,
        ) *
        config.maxPitchTorque *
        2;
      let finalRollTorque =
        THREE.MathUtils.clamp(
          angleKp * effectiveRollError - angleKd * bodyAngVel.z,
          -1,
          1,
        ) *
        config.maxRollTorque *
        2;
      let finalYawTorque =
        (-this.controls.yaw *
          config.maxYawTorque *
          this.settings.yawSensitivity -
          angVel.y * (Math.abs(this.controls.yaw) < 0.1 ? 0.02 : 0.002)) *
        2;

      const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
      const altitude = this.drone!.body.translation().y;
      const vertVel = this.drone!.body.linvel().y;
      const altError = this.targetAltitude - altitude;

      const altKp = 40.0;
      const altKd = 15.0;

      let thrustMagnitude = 0;
      if (this.batteryLevel > 0 && this.controls.throttle > 0.1) {
        const requiredAccel = altKp * altError - altKd * vertVel + 9.81;
        thrustMagnitude = THREE.MathUtils.clamp(
          (requiredAccel * config.droneMass) / (airDensityFactor * worldUp.y),
          0,
          config.maxThrust,
        );
      } else if (this.controls.throttle > 0.1) {
        this.targetAltitude = this.drone!.body.translation().y;
      }

      const thrustVector = {
        x: worldUp.x * thrustMagnitude * 2,
        y: worldUp.y * thrustMagnitude * 2,
        z: worldUp.z * thrustMagnitude * 2,
      };
      this.drone!.body.addForce(thrustVector, true);

      // Ground effect
      const dronePos = this.drone!.body.translation();
      const groundEffectHeight = 1.5; // Effect range in meters
      const ray = new RAPIER.Ray(
        { x: dronePos.x, y: dronePos.y, z: dronePos.z },
        { x: 0, y: -1, z: 0 },
      );
      const hit = this.world.castRay(
        ray,
        groundEffectHeight,
        true,
        undefined,
        undefined,
        this.drone!.collider,
      );
      if (hit !== null && thrustMagnitude > 0) {
        const distanceBelow = hit.timeOfImpact;
        const effectStrength = (1 - distanceBelow / groundEffectHeight) * 4;
        const groundEffectForce = {
          x: 0,
          y: thrustMagnitude + effectStrength,
          z: 0,
        };
        this.drone!.body.addForce(groundEffectForce, true);
      }

      /// Apply wind velocity
      const currentVel = this.drone!.body.linvel();
      this.drone!.body.setLinvel(
        {
          x: currentVel.x + this.windVector.x * deltaTime,
          y: currentVel.y,
          z: currentVel.z + this.windVector.z * deltaTime,
        },
        true,
      );

      const localTorque = new THREE.Vector3(
        finalPitchTorque,
        finalYawTorque,
        finalRollTorque,
      );
      const worldTorque = localTorque.clone().applyQuaternion(quaternion);

      this.drone!.body.addTorque(
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
      newControls.throttle = config.hoverThrottle * 0.98;
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

      if (this.targetControls.pitch !== 0 || this.targetControls.roll !== 0) {
        const pos = this.drone!.body.translation();
        this.targetPosition.set(pos.x, 0, pos.z);
      }
    }

    // Reset position (immediate, no delay)
    if (this.keys["r"]) {
      const startpointVector = locationVectors[this.spec.startpoint_locationId];
      this.drone!.body.setTranslation(
        new RAPIER.Vector3(
          startpointVector.x,
          startpointVector.y,
          startpointVector.z,
        ),
        true,
      );
      this.drone!.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      this.drone!.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      this.drone!.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.batteryLevel = 100;
      this.targetPosition.set(0, 0, 0);
      this.targetAltitude = 1;
    }

    // Super battery drain (immediate)
    if (this.keys["b"]) {
      this.batteryLevel = 2;
    }

    // Camera switching (immediate)
    if (this.keys["1"]) {
      console.log("Switching to FPV camera");
      this.camera = this.fpvCamera;
    }
    if (this.keys["2"]) {
      console.log("Switching to chase camera");
      this.camera = this.chaseCamera;
    }
    if (this.keys["3"]) {
      console.log("Switching to top camera");
      this.camera = this.topCamera;
    }

    // Update FOV if changed
    if (this.fpvCamera.fov !== this.settings.fov) {
      this.fpvCamera.fov = this.settings.fov;
      this.fpvCamera.updateProjectionMatrix();
    }

    // Smooth control inputs
    const controlSmoothing = 20.0;
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

    // Update target altitude based on throttle input
    const altitudeRate = 5.0; // m/s per throttle unit
    if (this.controls.throttle > 0.1) {
      this.targetAltitude +=
        (this.controls.throttle - config.hoverThrottle) *
        altitudeRate *
        deltaTime;
      this.targetAltitude = Math.max(0.1, this.targetAltitude);
    } else {
      // Keep target altitude synced with actual altitude when throttle is off
      const altitude = this.drone!.body.translation().y;
      this.targetAltitude = altitude;
    }
  }

  updateWind(deltaTime: number): void {
    if (!this.settings.windEnabled) {
      this.windVector.set(0, 0, 0);
      return;
    }

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
    this.environmentTemperatureChangeTimer += deltaTime;

    if (
      this.environmentTemperatureChangeTimer >=
      this.environmentTemperatureChangeInterval
    ) {
      // Generate new temperature target between 50°F and 90°F
      // 40 degree range
      const range = this.settings.temperatureMax - this.settings.temperatureMin;
      this.targetEnvironmentTemperature =
        this.settings.temperatureMin + Math.random() * range;

      this.environmentTemperatureChangeTimer = 0;
    }

    // Smoothly interpolate current temperature towards target
    const tempSmoothing = 0.05;
    this.environmentTemperature +=
      (this.targetEnvironmentTemperature - this.environmentTemperature) *
      tempSmoothing *
      deltaTime;
  }

  updatePing(deltaTime: number): void {
    if (!this.settings.pingEnabled) {
      this.pingDelay = 0;
      return;
    }

    this.pingChangeTimer += deltaTime;

    if (this.pingChangeTimer >= this.pingChangeInterval) {
      // Generate new ping value between 50-100ms
      this.pingDelay = Math.random() * 50 + 50;
      this.pingChangeTimer = 0;
    }
  }

  updateVideoInterference(deltaTime: number): void {
    if (
      !this.settings.videoInterferenceEnabled ||
      !this.videoInterferenceMaterial
    ) {
      if (this.videoInterferenceQuad && this.videoInterferenceQuad.parent) {
        this.scene.remove(this.videoInterferenceQuad);
      }
      return;
    }

    this.interferenceTimer += deltaTime;

    // Schedule next interference
    if (this.interferenceTimer >= this.nextInterferenceTime) {
      this.interferenceActive = !this.interferenceActive;

      if (this.interferenceActive) {
        // Start interference
        this.scene.add(this.videoInterferenceQuad!);
        this.nextInterferenceTime =
          this.interferenceTimer + Math.random() + 0.1; // 0.1-1.1s duration
      } else {
        // Stop interference
        this.scene.remove(this.videoInterferenceQuad!);
        this.nextInterferenceTime =
          this.interferenceTimer + Math.random() * 15 + 5; // 5-20s between interferences
      }
    }

    // Update shader
    if (this.interferenceActive) {
      this.videoInterferenceMaterial.uniforms.time.value =
        this.interferenceTimer;
      const intensity = Math.random() * 0.5 + 0.3; // 0.3-0.8 intensity
      this.videoInterferenceMaterial.uniforms.intensity.value = intensity;
    }
  }

  updateBattery(deltaTime: number): void {
    if (this.settings.infiniteBattery) {
      this.batteryLevel = 100;
      return;
    }

    const throttleSquared = this.controls.throttle * this.controls.throttle;
    let drainRate =
      (100 / config.maxFlightTime) *
      (0.5 + throttleSquared * 1.5) *
      this.settings.batteryDrainMultiplier;

    // Increase drain in extreme temperatures
    if (this.environmentTemperature < 60 || this.environmentTemperature > 80) {
      drainRate *= 1.5;
    }

    this.batteryLevel = Math.max(0, this.batteryLevel - drainRate * deltaTime);
  }

  updateCheckpoints(): void {
    for (const cp of this.checkpoints) {
      if (
        !cp.done &&
        this.world.intersectionPair(this.drone!.collider, cp.collider)
      ) {
        cp.done = true;
        (cp.mesh.material as THREE.MeshStandardMaterial).color.set(0x00ff00);
      }
    }
  }

  updateHUD(_deltaTime: number) {
    const vel = this.drone!.body.linvel();
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
    euler.setFromQuaternion(this.drone!.group.quaternion);
    const pitch = THREE.MathUtils.radToDeg(euler.x);
    const yaw = THREE.MathUtils.radToDeg(euler.y);
    const roll = THREE.MathUtils.radToDeg(euler.z);
    document.getElementById("pitch")!.textContent = `${pitch.toFixed(1)}°`;
    document.getElementById("roll")!.textContent = `${roll.toFixed(1)}°`;
    document.getElementById("yaw")!.textContent = `${yaw.toFixed(1)}°`;
    document.getElementById("velocity")!.textContent =
      `${(totalVelocity * 0.25).toFixed(1)} m/s`;
    document.getElementById("groundspeed")!.textContent =
      `${(groundSpeed * 0.25).toFixed(1)} m/s`;
    const altitude = this.drone!.body.translation().y;
    document.getElementById("altitude")!.textContent =
      `${(altitude * 0.25).toFixed(1)} m`;

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
      `${(windSpeed * 0.25).toFixed(1)} m/s`;
    document.getElementById("winddir")!.textContent =
      `${normalizedWindDir.toFixed(0)}°`;

    // Temperature
    document.getElementById("temperature")!.textContent =
      `${Math.round(this.environmentTemperature)}°F`;

    // Coordinates
    if (this.settings.showCoordinates) {
      const pos = this.drone!.body.translation();
      document.getElementById("coordinates")!.textContent =
        `X: ${pos.x.toFixed(1)} Y: ${pos.y.toFixed(1)} Z: ${pos.z.toFixed(1)}`;
      document.getElementById("coordinates-display")!.style.display = "block";
    } else {
      document.getElementById("coordinates-display")!.style.display = "none";
    }

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

  applySettings(newSettings: Partial<typeof this.settings>): void {
    Object.assign(this.settings, newSettings);

    // Apply FOV immediately
    this.fpvCamera.fov = this.settings.fov;
    this.fpvCamera.updateProjectionMatrix();

    // Reset wind if disabled
    if (!this.settings.windEnabled) {
      this.windVector.set(0, 0, 0);
      this.targetWindVector.set(0, 0, 0);
    }

    // Reset ping if disabled
    if (!this.settings.pingEnabled) {
      this.pingDelay = 0;
      this.inputBuffer = [];
    }
  }

  setupSettingsMenu(): void {
    const settingsButton = document.getElementById("settings-button");
    const settingsMenu = document.getElementById("settings-menu");
    const settingsBack = document.getElementById("settings-back");

    settingsButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsMenu!.style.display = "flex";
    });

    settingsBack?.addEventListener("click", () => {
      settingsMenu!.style.display = "none";
    });

    // FOV
    const fovSlider = document.getElementById("fov-slider") as HTMLInputElement;
    const fovValue = document.getElementById("fov-value");
    fovSlider?.addEventListener("input", () => {
      fovValue!.textContent = `${fovSlider.value}°`;
      this.settings.fov = parseInt(fovSlider.value);
    });

    // Wind
    const windToggle = document.getElementById(
      "wind-toggle",
    ) as HTMLInputElement;
    windToggle?.addEventListener("change", () => {
      this.settings.windEnabled = windToggle.checked;
    });

    // Ping
    const pingToggle = document.getElementById(
      "ping-toggle",
    ) as HTMLInputElement;
    pingToggle?.addEventListener("change", () => {
      this.settings.pingEnabled = pingToggle.checked;
    });

    // Auto-level
    const autoLevelToggle = document.getElementById(
      "autolevel-toggle",
    ) as HTMLInputElement;
    autoLevelToggle?.addEventListener("change", () => {
      this.settings.autoLevelEnabled = autoLevelToggle.checked;
    });

    const autoLevelSlider = document.getElementById(
      "autolevel-slider",
    ) as HTMLInputElement;
    const autoLevelValue = document.getElementById("autolevel-value");
    autoLevelSlider?.addEventListener("input", () => {
      autoLevelValue!.textContent = autoLevelSlider.value;
      this.settings.autoLevelStrength = parseFloat(autoLevelSlider.value);
    });

    // Temperature
    const tempMin = document.getElementById("temp-min") as HTMLInputElement;
    const tempMax = document.getElementById("temp-max") as HTMLInputElement;
    tempMin?.addEventListener("change", () => {
      this.settings.temperatureMin = parseInt(tempMin.value);
    });
    tempMax?.addEventListener("change", () => {
      this.settings.temperatureMax = parseInt(tempMax.value);
    });

    // Sensitivities
    const pitchSens = document.getElementById("pitch-sens") as HTMLInputElement;
    const pitchSensValue = document.getElementById("pitch-sens-value");
    pitchSens?.addEventListener("input", () => {
      pitchSensValue!.textContent = pitchSens.value;
      this.settings.pitchSensitivity = parseFloat(pitchSens.value);
    });

    const rollSens = document.getElementById("roll-sens") as HTMLInputElement;
    const rollSensValue = document.getElementById("roll-sens-value");
    rollSens?.addEventListener("input", () => {
      rollSensValue!.textContent = rollSens.value;
      this.settings.rollSensitivity = parseFloat(rollSens.value);
    });

    const yawSens = document.getElementById("yaw-sens") as HTMLInputElement;
    const yawSensValue = document.getElementById("yaw-sens-value");
    yawSens?.addEventListener("input", () => {
      yawSensValue!.textContent = yawSens.value;
      this.settings.yawSensitivity = parseFloat(yawSens.value);
    });

    // Battery drain
    const batteryDrain = document.getElementById(
      "battery-drain",
    ) as HTMLInputElement;
    const batteryDrainValue = document.getElementById("battery-drain-value");
    batteryDrain?.addEventListener("input", () => {
      batteryDrainValue!.textContent = `${batteryDrain.value}x`;
      this.settings.batteryDrainMultiplier = parseFloat(batteryDrain.value);
    });

    // Infinite Battery
    const infiniteBatteryToggle = document.getElementById(
      "infinite-battery-toggle",
    ) as HTMLInputElement;
    infiniteBatteryToggle?.addEventListener("change", () => {
      this.settings.infiniteBattery = infiniteBatteryToggle.checked;
    });

    // Show Coordinates
    const coordinatesToggle = document.getElementById(
      "coordinates-toggle",
    ) as HTMLInputElement;
    coordinatesToggle?.addEventListener("change", () => {
      this.settings.showCoordinates = coordinatesToggle.checked;
    });

    // Video Interference
    const videoInterferenceToggle = document.getElementById(
      "video-interference-toggle",
    ) as HTMLInputElement;
    videoInterferenceToggle?.addEventListener("change", () => {
      this.settings.videoInterferenceEnabled = videoInterferenceToggle.checked;
    });

    // Reset to defaults
    const resetButton = document.getElementById("reset-defaults");
    resetButton?.addEventListener("click", () => {
      // Reset all settings to defaults
      this.settings = {
        fov: 115,
        windEnabled: true,
        pingEnabled: true,
        temperatureMin: 50,
        temperatureMax: 90,
        pitchSensitivity: 1.0,
        rollSensitivity: 1.0,
        yawSensitivity: 1.0,
        autoLevelStrength: 1.0,
        autoLevelEnabled: true,
        batteryDrainMultiplier: 1.0,
        infiniteBattery: false,
        showCoordinates: false,
        videoInterferenceEnabled: true,
      };

      // Update all UI elements
      (document.getElementById("fov-slider") as HTMLInputElement).value = "115";
      document.getElementById("fov-value")!.textContent = "115°";
      (document.getElementById("wind-toggle") as HTMLInputElement).checked =
        true;
      (document.getElementById("ping-toggle") as HTMLInputElement).checked =
        true;
      (
        document.getElementById("autolevel-toggle") as HTMLInputElement
      ).checked = true;
      (document.getElementById("autolevel-slider") as HTMLInputElement).value =
        "1.0";
      document.getElementById("autolevel-value")!.textContent = "1.0";
      (document.getElementById("temp-min") as HTMLInputElement).value = "50";
      (document.getElementById("temp-max") as HTMLInputElement).value = "90";
      (document.getElementById("pitch-sens") as HTMLInputElement).value = "1.0";
      document.getElementById("pitch-sens-value")!.textContent = "1.0";
      (document.getElementById("roll-sens") as HTMLInputElement).value = "1.0";
      document.getElementById("roll-sens-value")!.textContent = "1.0";
      (document.getElementById("yaw-sens") as HTMLInputElement).value = "1.0";
      document.getElementById("yaw-sens-value")!.textContent = "1.0";
      (document.getElementById("battery-drain") as HTMLInputElement).value =
        "1.0";
      document.getElementById("battery-drain-value")!.textContent = "1.0x";
      (
        document.getElementById("infinite-battery-toggle") as HTMLInputElement
      ).checked = false;
      (
        document.getElementById("coordinates-toggle") as HTMLInputElement
      ).checked = false;
      (
        document.getElementById("video-interference-toggle") as HTMLInputElement
      ).checked = true;

      // Apply settings
      this.applySettings(this.settings);
    });
  }

  updateGraphics(deltaTime: number): void {
    // drone
    const dronePos = this.drone!.body.translation();
    const droneRot = this.drone!.body.rotation();
    this.drone!.group.position.set(dronePos.x, dronePos.y, dronePos.z);
    this.drone!.group.quaternion.set(
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

      this.drone!.propellers.forEach((prop, i) => {
        // Get propeller position in drone's local space
        const worldPos = new THREE.Vector3();
        prop.getWorldPosition(worldPos);
        const droneWorldPos = new THREE.Vector3();
        this.drone!.group.getWorldPosition(droneWorldPos);
        const droneWorldQuat = new THREE.Quaternion();
        this.drone!.group.getWorldQuaternion(droneWorldQuat);

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

        prop.rotation.z += speed * 4 * deltaTime; // rotate about local Z
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
