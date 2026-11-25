import * as THREE from 'three';

export function createLighting(scene, sunDir) {
  const sun = new THREE.DirectionalLight('#ffc08a', 3.2);
  sun.position.copy(sunDir).multiplyScalar(400);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = sun.shadow.camera;
  s.left = -160; s.right = 160; s.top = 160; s.bottom = -160;
  s.near = 10; s.far = 1000;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight('#d79a68', '#5a2c16', 0.9);
  scene.add(hemi);
  return { sun, hemi };
}
