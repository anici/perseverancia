import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function rand(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rockGeometry(seed) {
  const noise = new SimplexNoise({ random: rand(seed) });
  // mergeVertices: la icosfera no está indexada y sin esto las normales salen facetadas
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 5));
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise.noise3d(v.x * 1.2, v.y * 1.2, v.z * 1.2) * 0.28 +
              noise.noise3d(v.x * 3.5, v.y * 3.5, v.z * 3.5) * 0.08 +
              noise.noise3d(v.x * 9, v.y * 9, v.z * 9) * 0.025;
    v.multiplyScalar(1 + n);
    v.y *= 0.62; // más planas que altas
    if (v.y < -0.2) v.y = -0.2 + (v.y + 0.2) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Rocas instanciadas alrededor de la cámara, más densas en primer plano
export function createRocks(heightAt, center, forward) {
  const group = new THREE.Group();
  const r = rand(42);
  const mat = new THREE.MeshStandardMaterial({ color: '#b0643a', roughness: 0.9 });
  const dummy = new THREE.Object3D();
  const side = new THREE.Vector3(-forward.z, 0, forward.x);

  for (let k = 0; k < 4; k++) {
    const count = 110;
    const mesh = new THREE.InstancedMesh(rockGeometry(k * 13 + 3), mat, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const dist = 6 + Math.pow(r(), 1.8) * 320;
      const lateral = (r() - 0.5) * (20 + dist * 1.6);
      const x = center.x + forward.x * dist + side.x * lateral;
      const z = center.z + forward.z * dist + side.z * lateral;
      const big = r() < 0.06;
      const s = (big ? 2.2 + r() * 2.5 : 0.25 + Math.pow(r(), 2.5) * 1.6) * (1 + dist / 400);
      dummy.position.set(x, heightAt(x, z) - s * 0.15, z);
      dummy.rotation.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4);
      dummy.scale.set(s * (0.8 + r() * 0.6), s * (0.7 + r() * 0.6), s * (0.8 + r() * 0.6));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.04 + r() * 0.03, 0.35 + r() * 0.2, 0.42 + r() * 0.18);
      mesh.setColorAt(i, color);
    }
    group.add(mesh);
  }
  return group;
}
