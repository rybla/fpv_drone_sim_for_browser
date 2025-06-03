import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import * as config from "../config";

export type Controls = {
  throttle: number;
  pitch: number;
  roll: number;
  yaw: number;
};

export default class Level {
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

  constructor() {
    console.log("[Level.constructor]");

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
  }

  update(deltaTime: number): void {
    // TODO: anything?
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
}
