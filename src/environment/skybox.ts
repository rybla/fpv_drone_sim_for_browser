import * as THREE from "three";

export function createSkybox(scene: THREE.Scene) {
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
}
