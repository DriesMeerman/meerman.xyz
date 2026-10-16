// three.js scene for the orb. Loaded lazily by OrbWidget so three stays out of every other page.
import * as THREE from 'three';
import { PALETTES, paletteNamed } from './palettes.js';
import { SHELL_VERTEX, RING_VERTEX, BRIDGE_VERTEX, POINT_FRAGMENT, CORE_VERTEX, CORE_FRAGMENT } from './shaders.js';

const FOV = 30;
const FIT_RADIUS = 1.52; // world units that must fit in the shorter canvas side
const BASE_COUNTS = { low: 18000, medium: 40000, high: 72000 };

/**
 * @typedef {object} OrbSettings
 * @property {string} palette
 * @property {'low' | 'medium' | 'high'} density
 * @property {number} spin
 * @property {boolean} reducedMotion
 * @property {number} dayPhase 0..1, keys the ring inclinations so each day looks a little different
 */

/**
 * @typedef {object} Peer
 * @property {string} id
 * @property {number} dx screen px from this orb's centre to the peer's centre
 * @property {number} dy
 * @property {number} ppu peer's CSS px per world unit
 * @property {string} palette
 * @property {number} spin
 * @property {[number, number]} rot
 */

/** @param {string} hex */
const colour = (hex) => new THREE.Color(hex);

/** @param {number} count */
function spherePositions(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const z = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    positions[i * 3] = r * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.sin(phi);
    positions[i * 3 + 2] = z;
    seeds[i] = Math.random();
    // mostly small, a few large sparks
    sizes[i] = 0.5 + Math.pow(Math.random(), 3.0) * 1.7;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  return geometry;
}

/**
 * @param {number} count
 * @param {ReturnType<typeof ringLayout>} layout
 */
function ringPositions(count, layout) {
  const rings = layout.axes.length;
  const positions = new Float32Array(count * 3);
  const angle = new Float32Array(count);
  const ring = new Float32Array(count);
  const axis = new Float32Array(count * 3);
  const params = new Float32Array(count * 3);
  const jitter = new Float32Array(count * 2);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = i % rings;
    angle[i] = Math.random() * Math.PI * 2;
    ring[i] = r;
    axis[i * 3] = layout.axes[r].x;
    axis[i * 3 + 1] = layout.axes[r].y;
    axis[i * 3 + 2] = layout.axes[r].z;
    params[i * 3] = layout.radii[r];
    params[i * 3 + 1] = layout.speeds[r];
    params[i * 3 + 2] = layout.segments[r];
    const spread = Math.random() < 0.85 ? 0.012 : 0.04;
    jitter[i * 2] = (Math.random() * 2 - 1) * spread;
    jitter[i * 2 + 1] = (Math.random() * 2 - 1) * spread;
    seed[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1));
  geometry.setAttribute('aRing', new THREE.BufferAttribute(ring, 1));
  geometry.setAttribute('aAxis', new THREE.BufferAttribute(axis, 3));
  geometry.setAttribute('aParams', new THREE.BufferAttribute(params, 3));
  geometry.setAttribute('aJitter', new THREE.BufferAttribute(jitter, 2));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return geometry;
}

/** @param {number} count */
function bridgePositions(count) {
  const positions = new Float32Array(count * 3);
  const t = new Float32Array(count);
  const seed = new Float32Array(count);
  const rand = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    t[i] = Math.random();
    seed[i] = Math.random();
    rand[i * 3] = Math.random();
    rand[i * 3 + 1] = Math.random();
    rand[i * 3 + 2] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
  return geometry;
}

/** Radial gradient texture for the core halo, built without a DOM canvas. */
function haloTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.min(Math.sqrt(dx * dx + dy * dy) * 2, 1);
      const a = Math.pow(1 - r, 2.6);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

/**
 * @param {number} dayPhase
 * @returns {{ axes: THREE.Vector3[], radii: number[], speeds: number[], segments: number[] }}
 */
function ringLayout(dayPhase) {
  const base = dayPhase * Math.PI * 2;
  const axes = [
    new THREE.Vector3(Math.sin(base) * 0.25, 1, Math.cos(base) * 0.25).normalize(),
    new THREE.Vector3(Math.cos(base + 1.1) * 0.9, 0.55, Math.sin(base + 1.1) * 0.9).normalize(),
    new THREE.Vector3(Math.sin(base + 2.4) * 0.8, -0.35, Math.cos(base + 2.4) * 0.8).normalize(),
    new THREE.Vector3(0.1, 0.95, Math.sin(base) * 0.3).normalize()
  ];
  return {
    axes,
    radii: [1.2, 1.3, 1.4, 1.5],
    speeds: [0.12, -0.08, 0.06, -0.045],
    segments: [18, 26, 12, 40]
  };
}

/**
 * Builds one orb (shell, core, rings) as a group. Peers reuse this with their own palette.
 * @param {{ palette: string, shellCount: number, coreCount: number, ringCount: number, dayPhase: number, pointSize: number, camDist: number, halo: THREE.Texture }} spec
 */
function buildOrb(spec) {
  const palette = PALETTES[paletteNamed(spec.palette)];
  const group = new THREE.Group();
  /** @type {THREE.ShaderMaterial[]} */
  const materials = [];
  /** @type {THREE.BufferGeometry[]} */
  const geometries = [];

  const common = () => ({
    uTime: { value: 0 },
    uSpeed: { value: 1 },
    uSize: { value: spec.pointSize },
    uCamDist: { value: spec.camDist },
    uOpacity: { value: 1 }
  });

  /** @param {Record<string, { value: unknown }>} uniforms @param {string} vertex */
  const pointMaterial = (uniforms, vertex) => {
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    materials.push(material);
    return material;
  };

  // Shell
  const shellGeometry = spherePositions(spec.shellCount);
  geometries.push(shellGeometry);
  const shellUniforms = {
    ...common(),
    uRadius: { value: 1 },
    uFreq: { value: 1.15 },
    uWarp: { value: 0.3 },
    uPull: { value: 1.0 },
    uBands: { value: 3.5 },
    uHaze: { value: 0.1 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uPointerStrength: { value: 0 },
    uColorA: { value: colour(palette.shell[0]) },
    uColorB: { value: colour(palette.shell[1]) },
    uColorHot: { value: colour(palette.hot) }
  };
  const shell = new THREE.Points(shellGeometry, pointMaterial(shellUniforms, SHELL_VERTEX));
  shell.frustumCulled = false;
  group.add(shell);

  // Inner storm around the core, same shader with a tighter, faster field
  const innerGeometry = spherePositions(spec.coreCount);
  geometries.push(innerGeometry);
  const innerUniforms = {
    ...common(),
    uRadius: { value: 0.42 },
    uFreq: { value: 3.2 },
    uWarp: { value: 0.5 },
    uPull: { value: 0.8 },
    uBands: { value: 2 },
    uHaze: { value: 0.1 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uPointerStrength: { value: 0 },
    uColorA: { value: colour(palette.core).multiplyScalar(0.5) },
    uColorB: { value: colour(palette.hot) },
    uColorHot: { value: colour('#ffffff') }
  };
  innerUniforms.uSpeed.value = 2.2;
  innerUniforms.uSize.value = spec.pointSize * 1.0;
  const inner = new THREE.Points(innerGeometry, pointMaterial(innerUniforms, SHELL_VERTEX));
  inner.frustumCulled = false;
  group.add(inner);

  // Core sphere
  const coreGeometry = new THREE.SphereGeometry(0.26, 48, 32);
  geometries.push(coreGeometry);
  const coreUniforms = { uTime: { value: 0 }, uSpeed: { value: 1 }, uColor: { value: colour(palette.core) } };
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
    transparent: true,
    depthWrite: true
  });
  materials.push(coreMaterial);
  group.add(new THREE.Mesh(coreGeometry, coreMaterial));

  // Core halo
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: spec.halo, color: colour(palette.core), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })
  );
  halo.scale.setScalar(1.3);
  group.add(halo);

  // Rings
  const layout = ringLayout(spec.dayPhase);
  const ringGeometry = ringPositions(spec.ringCount, layout);
  geometries.push(ringGeometry);
  const ringUniforms = {
    ...common(),
    uRadius: { value: 1 },
    uColorA: { value: colour(palette.ring).multiplyScalar(0.35) },
    uColorB: { value: colour(palette.ring) },
    uColorHot: { value: colour('#ffffff').lerp(colour(palette.ring), 0.4) }
  };
  ringUniforms.uSize.value = spec.pointSize * 0.85;
  const rings = new THREE.Points(ringGeometry, pointMaterial(ringUniforms, RING_VERTEX));
  rings.frustumCulled = false;
  group.add(rings);

  const timeUniforms = [shellUniforms, innerUniforms, coreUniforms, ringUniforms];
  let haloPhase = Math.random() * 10;

  return {
    group,
    halo,
    shellUniforms,
    innerUniforms,
    /**
     * @param {number} time seconds
     * @param {number} motion 1 normally, small for reduced motion
     * @param {number} spin
     * @param {[number, number]} rot extra rotation from drag and parallax
     */
    update(time, motion, spin, rot) {
      for (const u of timeUniforms) u.uTime.value = time;
      shellUniforms.uSpeed.value = motion;
      innerUniforms.uSpeed.value = 2.2 * motion;
      coreUniforms.uSpeed.value = motion;
      ringUniforms.uSpeed.value = motion * (0.4 + 0.6 * Math.min(spin, 2));
      group.rotation.set(0.32 + rot[0], time * 0.11 * spin * motion + rot[1], 0.08);
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.3 * motion + haloPhase);
      halo.material.opacity = 0.5 + 0.25 * pulse;
      halo.scale.setScalar(1.2 + 0.18 * pulse);
    },
    /** @param {string} name */
    setPalette(name) {
      const p = PALETTES[paletteNamed(name)];
      shellUniforms.uColorA.value.set(p.shell[0]);
      shellUniforms.uColorB.value.set(p.shell[1]);
      shellUniforms.uColorHot.value.set(p.hot);
      innerUniforms.uColorA.value.set(p.core).multiplyScalar(0.5);
      innerUniforms.uColorB.value.set(p.hot);
      coreUniforms.uColor.value.set(p.core);
      halo.material.color.set(p.core);
      ringUniforms.uColorA.value.set(p.ring).multiplyScalar(0.35);
      ringUniforms.uColorB.value.set(p.ring);
    },
    /** @param {number} size @param {number} camDist */
    setPointSize(size, camDist) {
      shellUniforms.uSize.value = size;
      innerUniforms.uSize.value = size;
      ringUniforms.uSize.value = size * 0.85;
      for (const u of [shellUniforms, innerUniforms, ringUniforms]) u.uCamDist.value = camDist;
    },
    dispose() {
      group.removeFromParent();
      for (const m of materials) m.dispose();
      for (const g of geometries) g.dispose();
      halo.material.dispose();
    }
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {OrbSettings} settings
 */
export function createOrbScene(canvas, settings) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance', premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const halo = haloTexture();

  let width = 1;
  let height = 1;
  let dpr = 1;
  let camDist = 8;
  let ppu = 100; // CSS px per world unit at the orb's depth
  let pointSize = 3;
  let shellCount = 0;

  const state = {
    palette: paletteNamed(settings.palette),
    density: settings.density,
    spin: settings.spin,
    reducedMotion: settings.reducedMotion,
    dayPhase: settings.dayPhase
  };

  /** @type {ReturnType<typeof buildOrb> | null} */
  let orb = null;
  /** @type {Map<string, { orb: ReturnType<typeof buildOrb>, bridge: THREE.Points, bridgeUniforms: Record<string, { value: any }>, peer: Peer }>} */
  const peers = new Map();
  const bridgeGeometry = bridgePositions(3000);

  const pointer = { target: new THREE.Vector3(0, 0, 1), current: new THREE.Vector3(0, 0, 1), strength: 0, targetStrength: 0 };
  /** @type {[number, number]} */
  const rot = [0, 0];
  /** @type {[number, number]} */
  const rotTarget = [0, 0];
  const velocity = [0, 0];

  /** Particle budget from density, container size and pixel ratio. */
  function counts() {
    const base = BASE_COUNTS[state.density] ?? BASE_COUNTS.medium;
    const area = Math.sqrt(width * height) / 480;
    const scale = Math.min(Math.max(area, 0.45), 1.5) * (dpr > 1.5 ? 1 : 0.85);
    const shell = Math.round((base * scale) / 500) * 500;
    return { shell, inner: Math.round(shell * 0.2), ring: Math.round(2400 * Math.min(scale, 1.2)) };
  }

  function fitCamera() {
    const aspect = width / height;
    camera.aspect = aspect;
    const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camDist = FIT_RADIUS / (halfTan * Math.min(1, aspect));
    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    ppu = height / 2 / (camDist * halfTan);
    pointSize = 2.4 * dpr * Math.min(Math.max(Math.min(width, height) / 480, 0.6), 1.35);
  }

  function rebuild() {
    const c = counts();
    if (orb && c.shell === shellCount) {
      orb.setPointSize(pointSize, camDist);
      return;
    }
    orb?.dispose();
    shellCount = c.shell;
    orb = buildOrb({ palette: state.palette, shellCount: c.shell, coreCount: c.inner, ringCount: c.ring, dayPhase: state.dayPhase, pointSize, camDist, halo });
    scene.add(orb.group);
  }

  /** @param {Peer} peer */
  function addPeer(peer) {
    const c = counts();
    const peerOrb = buildOrb({ palette: peer.palette, shellCount: Math.round(c.shell * 0.6), coreCount: Math.round(c.inner * 0.6), ringCount: Math.round(c.ring * 0.6), dayPhase: state.dayPhase, pointSize, camDist, halo });
    scene.add(peerOrb.group);
    const own = PALETTES[state.palette];
    const theirs = PALETTES[paletteNamed(peer.palette)];
    const bridgeUniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uSize: { value: pointSize * 0.9 },
      uCamDist: { value: camDist },
      uOpacity: { value: 1 },
      uA: { value: new THREE.Vector3() },
      uB: { value: new THREE.Vector3() },
      uWidth: { value: 0.12 },
      uColorA: { value: colour(own.shell[1]) },
      uColorB: { value: colour(theirs.shell[1]) },
      uColorHot: { value: colour(theirs.shell[1]) }
    };
    const bridge = new THREE.Points(
      bridgeGeometry,
      new THREE.ShaderMaterial({ uniforms: bridgeUniforms, vertexShader: BRIDGE_VERTEX, fragmentShader: POINT_FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    bridge.frustumCulled = false;
    scene.add(bridge);
    peers.set(peer.id, { orb: peerOrb, bridge, bridgeUniforms, peer });
  }

  /** @param {string} id */
  function removePeer(id) {
    const entry = peers.get(id);
    if (!entry) return;
    entry.orb.dispose();
    entry.bridge.removeFromParent();
    /** @type {THREE.Material} */ (entry.bridge.material).dispose();
    peers.delete(id);
  }

  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1);

  let lastTime = 0;

  return {
    get particles() {
      let total = 0;
      scene.traverse((o) => {
        if (o instanceof THREE.Points) total += o.geometry.getAttribute('position').count;
      });
      return total;
    },
    get pointerStrength() {
      return pointer.strength;
    },
    get ppu() {
      return ppu;
    },
    get rot() {
      return rot;
    },
    /** @param {number} w @param {number} h @param {number} ratio */
    resize(w, h, ratio) {
      width = Math.max(1, Math.floor(w));
      height = Math.max(1, Math.floor(h));
      dpr = Math.min(ratio, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      fitCamera();
      rebuild();
      for (const entry of peers.values()) entry.orb.setPointSize(pointSize, camDist);
    },
    /** @param {Partial<OrbSettings>} next */
    configure(next) {
      let needsRebuild = false;
      if (next.palette !== undefined && paletteNamed(next.palette) !== state.palette) {
        state.palette = paletteNamed(next.palette);
        orb?.setPalette(state.palette);
        for (const entry of peers.values()) entry.bridgeUniforms.uColorA.value.set(PALETTES[state.palette].shell[1]);
      }
      if (next.density !== undefined && next.density !== state.density) {
        state.density = next.density;
        needsRebuild = true;
      }
      if (next.spin !== undefined) state.spin = next.spin;
      if (next.reducedMotion !== undefined) state.reducedMotion = next.reducedMotion;
      if (next.dayPhase !== undefined) state.dayPhase = next.dayPhase;
      if (needsRebuild) rebuild();
    },
    /**
     * Pointer in canvas CSS px, or null when it left. The field flares where the ray meets the shell.
     * @param {{ x: number, y: number } | null} point
     */
    setPointer(point) {
      if (!point || !orb || state.reducedMotion) {
        pointer.targetStrength = 0;
        return;
      }
      ndc.set((point.x / width) * 2 - 1, -(point.y / height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const ray = raycaster.ray;
      if (!ray.intersectSphere(sphere, tmpA)) {
        ray.closestPointToPoint(sphere.center, tmpA);
      }
      tmpA.normalize();
      tmpQ.copy(orb.group.quaternion).invert();
      pointer.target.copy(tmpA).applyQuaternion(tmpQ).normalize();
      pointer.targetStrength = 1;
      // gentle parallax toward the pointer
      rotTarget[0] = ndc.y * -0.12;
      rotTarget[1] = ndc.x * 0.18;
    },
    /** @param {number} dx @param {number} dy drag delta in CSS px */
    drag(dx, dy) {
      velocity[1] += dx * 0.004;
      velocity[0] += dy * 0.004;
    },
    /** @param {Peer[]} list */
    setPeers(list) {
      const seen = new Set();
      for (const peer of list) {
        seen.add(peer.id);
        const entry = peers.get(peer.id);
        if (!entry) {
          addPeer(peer);
        } else {
          if (paletteNamed(entry.peer.palette) !== paletteNamed(peer.palette)) {
            entry.orb.setPalette(peer.palette);
            entry.bridgeUniforms.uColorB.value.set(PALETTES[paletteNamed(peer.palette)].shell[1]);
            entry.bridgeUniforms.uColorHot.value.set(PALETTES[paletteNamed(peer.palette)].shell[1]);
          }
          entry.peer = peer;
        }
      }
      for (const id of [...peers.keys()]) if (!seen.has(id)) removePeer(id);
    },
    /** @param {number} time wall-clock seconds, shared by linked windows */
    render(time) {
      if (!orb) return;
      const dt = lastTime ? Math.min(time - lastTime, 0.1) : 0.016;
      lastTime = time;
      const motion = state.reducedMotion ? 0.12 : 1;

      // ease pointer
      pointer.strength += (pointer.targetStrength - pointer.strength) * Math.min(1, dt * 6);
      pointer.current.lerp(pointer.target, Math.min(1, dt * 10)).normalize();
      orb.shellUniforms.uPointer.value.copy(pointer.current);
      orb.shellUniforms.uPointerStrength.value = pointer.strength;
      orb.innerUniforms.uPointer.value.copy(pointer.current);
      orb.innerUniforms.uPointerStrength.value = pointer.strength * 0.5;

      // drag inertia plus parallax
      const damping = Math.pow(0.08, dt);
      velocity[0] *= damping;
      velocity[1] *= damping;
      if (pointer.targetStrength === 0) {
        rotTarget[0] = 0;
        rotTarget[1] = 0;
      }
      rot[0] += velocity[0] + (rotTarget[0] - rot[0]) * Math.min(1, dt * 2) * (state.reducedMotion ? 0 : 1);
      rot[1] += velocity[1] + (rotTarget[1] - rot[1]) * Math.min(1, dt * 2) * (state.reducedMotion ? 0 : 1);
      rot[0] = Math.max(-1.2, Math.min(1.2, rot[0]));

      orb.update(time, motion, state.spin, rot);

      for (const entry of peers.values()) {
        const { peer } = entry;
        const scale = peer.ppu / ppu;
        entry.orb.group.position.set(peer.dx / ppu, -peer.dy / ppu, 0);
        entry.orb.group.scale.setScalar(scale);
        entry.orb.update(time, motion, peer.spin, peer.rot);
        // bridge from our shell to theirs
        tmpB.copy(entry.orb.group.position);
        const len = tmpB.length();
        if (len > 1e-3) {
          tmpA.copy(tmpB).multiplyScalar(1 / len);
          entry.bridgeUniforms.uA.value.copy(tmpA).multiplyScalar(1.0);
          entry.bridgeUniforms.uB.value.copy(tmpB).addScaledVector(tmpA, -1.0 * scale);
          entry.bridgeUniforms.uWidth.value = 0.05 + Math.min(len, 12) * 0.012;
        }
        entry.bridgeUniforms.uTime.value = time;
        entry.bridgeUniforms.uSpeed.value = motion;
        entry.bridgeUniforms.uSize.value = pointSize * 0.9;
        entry.bridgeUniforms.uCamDist.value = camDist;
        entry.bridge.visible = len > 1.2;
      }

      renderer.render(scene, camera);
    },
    dispose() {
      orb?.dispose();
      for (const id of [...peers.keys()]) removePeer(id);
      bridgeGeometry.dispose();
      halo.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
