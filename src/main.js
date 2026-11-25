import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createTerrain } from './terrain.js';
import { createSky, SUN_DIR, SKY_FOG } from './sky.js';
import { createLighting } from './lighting.js';
import { createRocks } from './rocks.js';
import { createMoons } from './moons.js';
import { createDust } from './dust.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(SKY_FOG, 0.0016);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 9000);

const terrain = createTerrain();
scene.add(terrain.mesh);
scene.add(createSky());

// Encuadre: el sol queda a la izquierda del centro, las lunas a la derecha
const sunYaw = Math.atan2(SUN_DIR.x, -SUN_DIR.z);
const viewYaw = sunYaw + THREE.MathUtils.degToRad(16);
const forward = new THREE.Vector3(Math.sin(viewYaw), 0, -Math.cos(viewYaw));

// Cámara sobre la cresta más alta cercana, para ver el mar de dunas
let best = { x: 0, z: 0, h: -Infinity };
for (let x = -120; x <= 120; x += 6) {
  for (let z = -40; z <= 160; z += 6) {
    const ahead = terrain.heightAt(x + forward.x * 40, z + forward.z * 40);
    const score = terrain.heightAt(x, z) - Math.max(0, ahead - terrain.heightAt(x, z)) * 2;
    if (score > best.h) best = { x, z, h: score };
  }
}
const camPos = new THREE.Vector3(best.x, terrain.heightAt(best.x, best.z) + 3.2, best.z);
camera.position.copy(camPos);

const lights = createLighting(scene, SUN_DIR);
lights.sun.target.position.copy(camPos).addScaledVector(forward, 90);
lights.sun.position.copy(lights.sun.target.position).addScaledVector(SUN_DIR, 400);

scene.add(createRocks(terrain.heightAt, camPos, forward));
const moons = createMoons(camPos, viewYaw);
scene.add(moons);
const dust = createDust();
scene.add(dust);

const target = camPos.clone().addScaledVector(forward, 100);
target.y = camPos.y + 1.5;
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(target);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.55;
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.5, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

let last = performance.now();
let frames = 0;
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  dust.userData.update(dt, camera);
  moons.userData.phobos.rotation.y += dt * 0.01;
  controls.update();
  composer.render();
  if (++frames === 5) window.__sceneReady = true;
});
