import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

const noise = new SimplexNoise({ random: mulberry32(7) });

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fbm(x, z, oct = 5) {
  let a = 1, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise.noise(x * f, z * f);
    n += a; a *= 0.5; f *= 2.03;
  }
  return s / n;
}

// Dunas: crestas asimétricas perpendiculares al viento, deformadas por ruido
const WIND = new THREE.Vector2(0.8, 0.6).normalize();
export function heightAt(x, z) {
  const along = x * WIND.x + z * WIND.y;
  const across = -x * WIND.y + z * WIND.x;
  const warp = fbm(x * 0.004, z * 0.004, 3) * 60;
  const phase = (along + warp + Math.sin(across * 0.012) * 18) / 55;
  const saw = phase - Math.floor(phase);
  // barlovento suave, sotavento empinado
  const ridge = saw < 0.78 ? Math.pow(saw / 0.78, 1.6) : Math.pow(1 - (saw - 0.78) / 0.22, 1.3);
  const duneMask = THREE.MathUtils.smoothstep(fbm(x * 0.0025 + 10, z * 0.0025, 3), -0.35, 0.3);
  const dunes = ridge * 9 * (0.35 + duneMask);
  const hills = fbm(x * 0.0012, z * 0.0012, 4) * 45;
  const ripples = noise.noise(along * 0.45, across * 0.03) * 0.12;
  const far = Math.max(0, Math.hypot(x, z) - 900) * 0.18; // montañas en el horizonte
  const mesas = far * (0.6 + fbm(x * 0.003, z * 0.003, 4));
  return dunes + hills + ripples + mesas;
}

export function createTerrain() {
  const size = 3000, seg = 320;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();

  const colors = new Float32Array(pos.count * 3);
  const nrm = geo.attributes.normal;
  const sand = new THREE.Color('#c0703f');
  const dark = new THREE.Color('#6e3519');
  const light = new THREE.Color('#d89a68');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const slope = 1 - nrm.getY(i);
    const n = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5;
    c.copy(sand).lerp(light, THREE.MathUtils.clamp(y / 40 + n * 0.3, 0, 1) * 0.6);
    c.lerp(dark, THREE.MathUtils.clamp(slope * 2.5 + (1 - n) * 0.25, 0, 0.85));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return { mesh, heightAt };
}
