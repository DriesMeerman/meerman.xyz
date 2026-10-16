// GLSL for the orb. Everything animates on the GPU from a single time uniform, so the CPU only
// updates a handful of uniforms per frame.

// 3D simplex noise by Ian McEwan, Ashima Arts (MIT).
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Shared by every point cloud: a soft sprite with a hot centre, additive.
export const POINT_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorHot;
uniform float uOpacity;
varying float vIntensity;
varying float vHot;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r2 = dot(uv, uv) * 4.0;
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 7.0);
  float glow = exp(-r2 * 2.0) * 0.3;
  float a = (core + glow) * clamp(vIntensity, 0.0, 2.5) * uOpacity;
  vec3 col = mix(uColorA, uColorB, clamp(vIntensity, 0.0, 1.0));
  col = mix(col, uColorHot, clamp(vHot, 0.0, 1.0));
  col += vec3(0.6) * core * clamp(vIntensity - 0.75, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

// Particles on a spherical shell. A domain-warped noise field is sliced into contour bands and each
// particle takes a Newton step toward the nearest band, so the cloud bunches into flowing filaments.
export const SHELL_VERTEX = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uSize;
uniform float uCamDist;
uniform float uRadius;
uniform float uFreq;
uniform float uWarp;
uniform float uPull;
uniform float uBands;
uniform float uHaze;
uniform vec3 uPointer;
uniform float uPointerStrength;
attribute float aSeed;
attribute float aSize;
varying float vIntensity;
varying float vHot;
${NOISE}

float filament(vec3 p, float t) {
  vec3 q = p * uFreq + vec3(0.0, t * 0.06, t * 0.045);
  float a = snoise(q);
  float b = snoise(q * 2.3 + vec3(3.7, -1.9, 5.3) + a * 0.55);
  return a * 0.78 + b * 0.22;
}

void main() {
  float t = uTime * uSpeed;
  vec3 n0 = normalize(position);
  float dt = t * 0.035;
  vec3 w = vec3(
    snoise(n0 * 1.3 + vec3(dt, 0.0, 11.0)),
    snoise(n0 * 1.3 + vec3(0.0, dt, 23.0)),
    snoise(n0 * 1.3 + vec3(31.0, 0.0, dt)));
  vec3 p = normalize(n0 + uWarp * w);

  vec3 up = abs(p.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tA = normalize(cross(p, up));
  vec3 tB = cross(p, tA);
  float f0 = filament(p, t);
  float e = 0.03;
  float fA = filament(normalize(p + e * tA), t);
  float fB = filament(normalize(p + e * tB), t);
  vec2 g = vec2(fA - f0, fB - f0) / e;
  float gl = length(g) + 0.08;
  float d = (fract(f0 * uBands + 0.5) - 0.5) / uBands;
  float s = clamp(d / gl, -0.5, 0.5) * uPull;
  p = normalize(p - (g.x * tA + g.y * tB) / gl * s);

  float near = exp(-pow(abs(d) * uBands * 3.0, 2.0));
  float act = 0.5 + 0.5 * snoise(p * 0.8 + vec3(t * 0.02, 7.0, -t * 0.015));
  float twinkle = 0.78 + 0.22 * sin(t * 1.7 + aSeed * 6.2831);
  float intensity = mix(uHaze, 1.15, near) * (0.5 + 0.5 * act) * twinkle;
  float r = uRadius * (1.0 + 0.05 * f0 + 0.04 * near);

  float hot = 0.0;
  if (uPointerStrength > 0.001) {
    float dist = distance(p, uPointer);
    float inf = smoothstep(0.7, 0.0, dist) * uPointerStrength;
    float ang = inf * 1.2;
    float c = cos(ang);
    float sn = sin(ang);
    vec3 k = uPointer;
    p = p * c + cross(k, p) * sn + k * dot(k, p) * (1.0 - c);
    r *= 1.0 + inf * 0.16;
    intensity += inf * 0.9;
    hot = inf;
  }

  vec4 mv = modelViewMatrix * vec4(p * r, 1.0);
  vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float depth = clamp((mv.z - centre.z) / uRadius, -1.0, 1.0);
  intensity *= 0.42 + 0.58 * smoothstep(-1.0, 1.0, depth);

  gl_Position = projectionMatrix * mv;
  float sz = uSize * aSize * (0.75 + 0.55 * near + hot * 0.8);
  gl_PointSize = sz * (uCamDist / -mv.z);
  vIntensity = intensity;
  vHot = hot;
}
`;

// Thin lattice rings at a few inclinations: dashed segments drift around, with a few bright beads.
// Ring data (axis, radius, speed, segment count) is baked per vertex so any number of rings works.
export const RING_VERTEX = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uSize;
uniform float uCamDist;
uniform float uRadius;
attribute float aAngle;
attribute float aRing;
attribute vec3 aAxis;
attribute vec3 aParams;
attribute vec2 aJitter;
attribute float aSeed;
varying float vIntensity;
varying float vHot;

void main() {
  float t = uTime * uSpeed;
  vec3 axis = normalize(aAxis);
  float R = aParams.x * uRadius;
  float ang = aAngle + t * aParams.y;
  vec3 up = abs(axis.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 u = normalize(cross(axis, up));
  vec3 v = cross(axis, u);
  vec3 p = axis * aJitter.y * uRadius + (u * cos(ang) + v * sin(ang)) * (R + aJitter.x * uRadius);

  float dash = smoothstep(0.25, 0.95, 0.5 + 0.5 * sin(ang * aParams.z - t * 0.9 + aRing * 1.7));
  float bead = pow(0.5 + 0.5 * sin(ang + t * (0.7 + 0.2 * aRing) + aRing * 2.1), 32.0);
  float twinkle = 0.8 + 0.2 * sin(t * 2.3 + aSeed * 6.2831);
  float intensity = (0.22 + 0.7 * dash + 2.2 * bead) * twinkle;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float depth = clamp((mv.z - centre.z) / (R + 0.001), -1.0, 1.0);
  intensity *= 0.35 + 0.65 * smoothstep(-1.0, 1.0, depth);

  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + 0.4 * aSeed + bead * 1.2) * (uCamDist / -mv.z);
  vIntensity = intensity;
  vHot = bead * 0.5;
}
`;

// A twisted strand of particles between two orbs in different windows.
export const BRIDGE_VERTEX = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uSpeed;
uniform float uSize;
uniform float uCamDist;
uniform vec3 uA;
uniform vec3 uB;
uniform float uWidth;
attribute float aT;
attribute float aSeed;
attribute vec3 aRand;
varying float vIntensity;
varying float vHot;
${NOISE}

void main() {
  float t0 = uTime * uSpeed;
  float t = fract(aT + t0 * 0.04 * (0.5 + aRand.z));
  vec3 dir = uB - uA;
  float len = max(length(dir), 0.001);
  vec3 d = dir / len;
  vec3 up = abs(d.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 n1 = normalize(cross(d, up));
  vec3 n2 = cross(d, n1);
  float env = sin(t * 3.14159);
  float strand = t * (6.0 + 4.0 * aRand.y) * 3.14159 + aSeed * 6.2831 + t0 * 0.9;
  float spiral = uWidth * (0.25 + 0.75 * aRand.x) * env;
  vec2 wob = vec2(
    snoise(vec3(t * 3.0 + aSeed * 7.0, t0 * 0.35, 2.0)),
    snoise(vec3(t * 3.0 + aSeed * 7.0, t0 * 0.35 + 9.0, 5.0)));
  vec3 p = uA + dir * t + (n1 * cos(strand) + n2 * sin(strand)) * spiral + (n1 * wob.x + n2 * wob.y) * uWidth * 1.6 * env;

  float pulse = pow(0.5 + 0.5 * sin(t * 28.0 - t0 * 5.0 + aSeed * 3.0), 10.0);
  float intensity = (0.25 + 0.3 * env + 1.6 * pulse) * (0.7 + 0.3 * aRand.y);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + 0.7 * aRand.x + pulse * 0.9) * (uCamDist / -mv.z);
  vIntensity = intensity;
  vHot = t;
}
`;

// The core: a dark sphere with a fresnel rim and slow veins of light under the surface.
export const CORE_VERTEX = /* glsl */ `
precision highp float;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vP = position;
  gl_Position = projectionMatrix * mv;
}
`;

export const CORE_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uTime;
uniform float uSpeed;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
${NOISE}
void main() {
  float t = uTime * uSpeed;
  float facing = max(dot(normalize(vN), normalize(vV)), 0.0);
  float fres = pow(1.0 - facing, 2.4);
  float n = 0.5 + 0.5 * snoise(vP * 3.2 + vec3(t * 0.22, 0.0, -t * 0.17));
  float n2 = 0.5 + 0.5 * snoise(vP * 7.5 - vec3(0.0, t * 0.35, t * 0.1));
  float veins = smoothstep(0.42, 0.6, n) * (0.4 + 0.6 * n2);
  vec3 col = uColor * (0.3 + 0.9 * veins) + uColor * fres * 1.8 + vec3(1.0) * (fres * fres * 0.5 + veins * 0.08);
  float a = 0.85 + 0.15 * fres;
  gl_FragColor = vec4(col, a);
}
`;
