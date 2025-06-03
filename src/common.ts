import * as THREE from "three";
import type RAPIER from "@dimforge/rapier3d-compat";

export type Level = {
  world: RAPIER.World;
  scene: THREE.Scene;
  textureLoader: THREE.TextureLoader;
};

export type Controls = {
  throttle: number;
  pitch: number;
  roll: number;
  yaw: number;
};
