import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { Controls, Level } from "../common";
import { createSkybox } from "../environment/skybox";

export function createBasicLevel(): Level {
  // scene

  const scene = new THREE.Scene();

  // renderer

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // textureLoader

  const textureLoader = new THREE.TextureLoader();

  // skybox

  createSkybox(scene);

  // world

  const world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

  // return

  return { world, scene, textureLoader };
}
