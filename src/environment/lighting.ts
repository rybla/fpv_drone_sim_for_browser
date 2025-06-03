import * as THREE from "three";

export function createLighting(scene: THREE.Scene) {
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
}
