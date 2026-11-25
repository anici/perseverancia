import * as THREE from 'three';

// Sol de tarde: bajo sobre el horizonte, hacia -Z
export const SUN_DIR = new THREE.Vector3(-0.35, 0.16, -1).normalize();
export const SKY_FOG = new THREE.Color('#c58a5a');

export function createSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      sunDir: { value: SUN_DIR },
      zenith: { value: new THREE.Color('#7a4a2e') },
      mid: { value: new THREE.Color('#c98a55') },
      horizon: { value: new THREE.Color('#e8b583') },
      halo: { value: new THREE.Color('#a9c4d8') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w; // siempre al fondo
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDir, zenith, mid, horizon, halo;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
        col = mix(col, zenith, smoothstep(0.15, 0.85, h));
        float s = max(dot(d, sunDir), 0.0);
        // halo azulado del atardecer marciano + brillo cálido amplio
        col = mix(col, halo, pow(s, 18.0) * 0.55);
        col += vec3(1.0, 0.75, 0.45) * pow(s, 6.0) * 0.35;
        col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 6.0; // disco solar
        col += vec3(1.0, 0.9, 0.8) * pow(s, 400.0) * 2.0;
        // bruma de polvo cerca del horizonte
        col = mix(col, horizon * 1.05, exp(-max(h, 0.0) * 14.0) * 0.5);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 48, 24), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return sky;
}
