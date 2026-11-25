import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function potato(stretch, seed, detail = 4) {
  const noise = new SimplexNoise({ random: () => ((seed = (seed * 16807) % 2147483647) / 2147483647) });
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, detail));
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let n = noise.noise3d(v.x * 1.3, v.y * 1.3, v.z * 1.3) * 0.12;
    // cráteres
    n -= Math.max(0, noise.noise3d(v.x * 4, v.y * 4, v.z * 4) - 0.45) * 0.35;
    v.multiplyScalar(1 + n).multiply(stretch);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Fobos y Deimos: mallas irregulares lejanas, iluminadas por el sol.
 * Se colocan por ángulo (yaw/elevación) respecto a la cámara para que queden en el encuadre.
 */
export function createMoons(camPos, viewYaw) {
  const group = new THREE.Group();
  // De día las lunas se ven pálidas y algo veladas por el polvo
  const mat = (c, e) => new THREE.MeshStandardMaterial({
    color: c, roughness: 1, emissive: e, emissiveIntensity: 1, fog: false,
    transparent: true, opacity: 0.88,
  });
  const place = (mesh, yawOffset, elev, dist) => {
    const yaw = viewYaw + yawOffset;
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(elev), Math.sin(elev), -Math.cos(yaw) * Math.cos(elev));
    mesh.position.copy(camPos).addScaledVector(dir, dist);
    return mesh;
  };

  // Fobos: más grande y alargada, cerca del horizonte
  const phobos = new THREE.Mesh(potato(new THREE.Vector3(1.35, 1.0, 1.1), 11), mat('#ead0b6', '#a07e64'));
  phobos.scale.setScalar(60);
  phobos.rotation.set(0.3, 1.2, 0.5);
  place(phobos, THREE.MathUtils.degToRad(27), THREE.MathUtils.degToRad(13), 3800);

  // Deimos: pequeña y más alta
  const deimos = new THREE.Mesh(potato(new THREE.Vector3(1.2, 1.0, 1.0), 29, 3), mat('#f4e2cc', '#d0ae90'));
  deimos.scale.setScalar(34);
  place(deimos, THREE.MathUtils.degToRad(10), THREE.MathUtils.degToRad(19), 3800);

  group.add(phobos, deimos);
  group.userData = { phobos, deimos };
  return group;
}
