import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export default class BasicLevel {
  world: RAPIER.World;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  textureLoader: THREE.TextureLoader;

  /**
   * for each key, whether or not it's currently being held down
   */
  keys: { [key: string]: boolean };

  fpvCamera: THREE.PerspectiveCamera;
  chaseCamera: THREE.PerspectiveCamera;
  topCamera: THREE.PerspectiveCamera;
  /**
   * the currently active camera that is being rendered from
   */
  currentCamera: THREE.PerspectiveCamera;

  constructor() {
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

    // keys

    this.keys = {};
  }

  async initialize(): Promise<void> {
    console.warn("TODO: initialize stuff");
  }

  update(deltaTime: number, accumulator: number): void {
    throw new Error("Method not implemented.");
  }
}
