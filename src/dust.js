import * as THREE from 'three';

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Polvo suspendido que deriva con el viento alrededor de la cámara
export function createDust(count = 2500, box = 140) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * box;
    pos[i * 3 + 1] = Math.random() * 30 - 4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * box;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: dotTexture(), color: '#e0a878', size: 0.35, transparent: true, opacity: 0.55,
    depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  const wind = new THREE.Vector3(2.4, 0.15, 1.6);
  points.userData.update = (dt, camera) => {
    const a = geo.attributes.position;
    const half = box / 2;
    for (let i = 0; i < count; i++) {
      let x = a.array[i * 3] + wind.x * dt + Math.sin(i + performance.now() * 0.0007) * 0.02;
      let y = a.array[i * 3 + 1] + wind.y * dt * Math.sin(i * 0.37);
      let z = a.array[i * 3 + 2] + wind.z * dt;
      if (x > half) x -= box; if (z > half) z -= box;
      if (y > 26) y = -4; if (y < -4) y = 26;
      a.array[i * 3] = x; a.array[i * 3 + 1] = y; a.array[i * 3 + 2] = z;
    }
    a.needsUpdate = true;
    points.position.set(camera.position.x, camera.position.y - 6, camera.position.z);
  };
  return points;
}
