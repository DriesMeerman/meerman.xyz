// three.js stage for the dice widget: a holographic die over a ring platform, an idle hover, a throw
// tumble that settles with the rolled face toward the camera, and hit or miss effects.
// Only loaded through a dynamic import from DiceWidget so three.js stays out of other pages.
import * as THREE from 'three';
import { buildShape } from './geometry.js';

/**
 * @typedef {object} DiceColors
 * @property {string} accent
 * @property {string} hot
 * @property {string} ink
 * @property {boolean} dark
 * @property {string} font
 */

const TEXTURE_SIZE = 256;
const THROW_SECONDS = 1.9;
const REST_Y = 0;
const FLOOR_Y = -1.32;

/** Bounce arcs for the throw: [start, end, peak height] in seconds and scene units. */
const ARCS = [
  [0, 0.74, 0.62],
  [0.74, 1.12, 0.22],
  [1.12, 1.34, 0.06]
];

/** @param {number} x */
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
/** @param {number} x */
const smooth = (x) => x * x * (3 - 2 * x);
/** @param {number} x */
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * @param {HTMLElement} host element the canvas fills
 * @param {{ colors: DiceColors, reducedMotion: boolean }} settings
 */
export function createDiceScene(host, settings) {
  let colors = settings.colors;
  let reducedMotion = settings.reducedMotion;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const lookAt = new THREE.Vector3(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 5, 6);
  scene.add(key);

  // Platform: concentric rings and tick marks under the die.
  const platform = new THREE.Group();
  platform.position.y = FLOOR_Y;
  scene.add(platform);
  /** @type {THREE.LineBasicMaterial[]} */
  const platformMaterials = [];
  /** @param {number} radius @param {number} opacity @param {number} [segments] */
  const ring = (radius, opacity, segments = 96) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const material = new THREE.LineBasicMaterial({ transparent: true, opacity, depthWrite: false });
    platformMaterials.push(material);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    line.userData.baseOpacity = opacity;
    platform.add(line);
    return line;
  };
  ring(1.05, 0.5);
  ring(1.6, 0.28);
  ring(2.2, 0.12);
  {
    const ticks = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const inner = i % 4 === 0 ? 1.62 : 1.7;
      ticks.push(new THREE.Vector3(Math.cos(angle) * inner, 0, Math.sin(angle) * inner));
      ticks.push(new THREE.Vector3(Math.cos(angle) * 1.82, 0, Math.sin(angle) * 1.82));
    }
    const material = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.32, depthWrite: false });
    material.userData.baseOpacity = 0.32;
    platformMaterials.push(material);
    const tickLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), material);
    tickLines.userData.baseOpacity = 0.32;
    platform.add(tickLines);
  }
  const pulse = ring(1.05, 0, 96);
  pulse.userData.baseOpacity = 0;

  // Burst particles for a hit.
  const BURST = 90;
  const burstPositions = new Float32Array(BURST * 3);
  const burstVelocity = new Float32Array(BURST * 3);
  const burstGeometry = new THREE.BufferGeometry();
  burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
  const burstMaterial = new THREE.PointsMaterial({ size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const burst = new THREE.Points(burstGeometry, burstMaterial);
  burst.frustumCulled = false;
  scene.add(burst);

  // The die itself.
  const die = new THREE.Group();
  scene.add(die);
  /** @type {ReturnType<typeof buildDie> | null} */
  let current = null;

  const state = {
    mode: /** @type {'idle' | 'rolling' | 'rest'} */ ('idle'),
    clock: 0,
    rollStart: 0,
    fromQuaternion: new THREE.Quaternion(),
    targetQuaternion: new THREE.Quaternion(),
    fromPosition: new THREE.Vector3(),
    spinA: new THREE.Vector3(1, 0, 0),
    spinB: new THREE.Vector3(0, 1, 0),
    turnsA: 0,
    turnsB: 0,
    drift: 0,
    restSince: 0,
    nextFlicker: 0,
    effect: /** @type {'hit' | 'miss' | null} */ (null),
    effectStart: 0,
    pulseStart: -10,
    pulseStrength: 0,
    bouncesSeen: 0,
    /** @type {null | (() => void)} */
    resolve: null,
    result: 0,
    sides: 20,
    tiltSide: 1
  };
  const idleAxis = new THREE.Vector3(0.25, 1, 0.12).normalize();
  const idleBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.45, 0.3, 0.12));

  let width = 1;
  let height = 1;
  let active = true;
  let frame = 0;
  let last = 0;
  let disposed = false;

  /**
   * Paints one face label onto its canvas.
   * @param {{ canvas: HTMLCanvasElement, texture: THREE.CanvasTexture, uv: { x: number, y: number }[], inradius: number, value: number | null }} slot
   * @param {number | null} value
   * @param {number} sides
   */
  function paint(slot, value, sides) {
    slot.value = value;
    const ctx = /** @type {CanvasRenderingContext2D} */ (slot.canvas.getContext('2d'));
    const s = TEXTURE_SIZE;
    ctx.clearRect(0, 0, s, s);
    ctx.beginPath();
    slot.uv.forEach((p, i) => (i ? ctx.lineTo(p.x * s, (1 - p.y) * s) : ctx.moveTo(p.x * s, (1 - p.y) * s)));
    ctx.closePath();
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.6);
    if (colors.dark) {
      gradient.addColorStop(0, withAlpha(colors.accent, 0.2));
      gradient.addColorStop(1, withAlpha(colors.accent, 0.06));
    } else {
      gradient.addColorStop(0, 'rgba(255,255,255,0.92)');
      gradient.addColorStop(1, withAlpha(colors.accent, 0.16));
    }
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = withAlpha(colors.accent, colors.dark ? 0.35 : 0.3);
    ctx.stroke();
    if (value === null) return void (slot.texture.needsUpdate = true);

    const text = String(value);
    const radius = slot.inradius * s;
    let size = radius * (text.length === 1 ? 1.4 : text.length === 2 ? 1.15 : 0.85);
    ctx.font = `${Math.round(size)}px ${colors.font}`;
    const widthLimit = radius * 1.8;
    const measured = ctx.measureText(text).width;
    if (measured > widthLimit) {
      size *= widthLimit / measured;
      ctx.font = `${Math.round(size)}px ${colors.font}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = s / 2;
    const cy = s / 2 + size * 0.04;
    if (colors.dark) {
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur = size * 0.35;
    }
    ctx.fillStyle = colors.dark ? '#f2feff' : colors.ink;
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
    // Underline 6 and 9 (and friends) so they cannot be confused.
    if (sides >= 9 && /^[69]+$/.test(text)) {
      const w = ctx.measureText(text).width;
      ctx.fillRect(cx - w / 2, cy + size * 0.5, w, Math.max(3, size * 0.07));
    }
    slot.texture.needsUpdate = true;
  }

  /** @param {number} sides */
  function buildDie(sides) {
    const shape = buildShape(sides);
    /** @type {number[]} */
    const positions = [];
    /** @type {number[]} */
    const normals = [];
    /** @type {number[]} */
    const uvs = [];
    const geometry = new THREE.BufferGeometry();
    const materials = [];
    const slots = [];
    const edgePoints = [];
    let offset = 0;
    for (let index = 0; index < shape.faces.length; index++) {
      const face = shape.faces[index];
      const right = new THREE.Vector3().crossVectors(face.up, face.normal).normalize();
      const local = face.points.map((p) => {
        const d = new THREE.Vector3().subVectors(p, face.center);
        return { x: d.dot(right), y: d.dot(face.up) };
      });
      const extent = Math.max(...local.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 2.04;
      const uv = local.map((p) => ({ x: 0.5 + p.x / extent, y: 0.5 + p.y / extent }));
      // Smallest distance from the centre to an edge, as a fraction of the texture.
      let inradius = Infinity;
      for (let i = 0; i < uv.length; i++) {
        const a = uv[i];
        const b = uv[(i + 1) % uv.length];
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        inradius = Math.min(inradius, Math.abs(ex * (a.y - 0.5) - ey * (a.x - 0.5)) / Math.hypot(ex, ey));
      }
      for (let i = 1; i < face.points.length - 1; i++) {
        for (const k of [0, i, i + 1]) {
          const p = face.points[k];
          positions.push(p.x, p.y, p.z);
          normals.push(face.normal.x, face.normal.y, face.normal.z);
          uvs.push(uv[k].x, uv[k].y);
        }
      }
      const count = (face.points.length - 2) * 3;
      geometry.addGroup(offset, count, index);
      offset += count;
      for (let i = 0; i < face.points.length; i++) {
        edgePoints.push(face.points[i].clone(), face.points[(i + 1) % face.points.length].clone());
      }

      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = faceCanvas.height = TEXTURE_SIZE;
      const texture = new THREE.CanvasTexture(faceCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const slot = { canvas: faceCanvas, texture, uv, inradius, value: face.value };
      paint(slot, face.value, sides);
      slots.push(slot);
      materials.push(
        new THREE.MeshLambertMaterial({
          map: texture,
          emissive: 0xffffff,
          emissiveMap: texture,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.94,
          side: THREE.FrontSide
        })
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.renderOrder = 1;

    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
    const edgeMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95 });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.renderOrder = 2;
    // Hidden edges show faintly through the faces, which sells the hologram.
    const hiddenMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22, depthFunc: THREE.GreaterDepth, depthWrite: false });
    const hidden = new THREE.LineSegments(edgeGeometry, hiddenMaterial);
    hidden.renderOrder = 3;
    // A slightly larger outer shell of edges gives a soft glow.
    const haloMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending });
    const halo = new THREE.LineSegments(edgeGeometry, haloMaterial);
    halo.scale.setScalar(1.035);
    halo.renderOrder = 4;

    const group = new THREE.Group();
    group.add(mesh, edges, hidden, halo);
    return { shape, sides, group, geometry, edgeGeometry, materials, slots, edgeMaterial, hiddenMaterial, haloMaterial };
  }

  /** @param {ReturnType<typeof buildDie>} built */
  function disposeDie(built) {
    built.geometry.dispose();
    built.edgeGeometry.dispose();
    for (const material of built.materials) material.dispose();
    for (const slot of built.slots) slot.texture.dispose();
    built.edgeMaterial.dispose();
    built.hiddenMaterial.dispose();
    built.haloMaterial.dispose();
    die.remove(built.group);
  }

  function applyColors() {
    const accent = new THREE.Color(colors.accent);
    for (const material of platformMaterials) material.color.copy(accent);
    burstMaterial.color.copy(accent);
    if (current) {
      current.edgeMaterial.color.copy(accent);
      current.hiddenMaterial.color.copy(accent);
      current.haloMaterial.color.copy(accent);
      current.haloMaterial.opacity = colors.dark ? 0.22 : 0.08;
      for (const material of current.materials) material.emissiveIntensity = colors.dark ? 0.6 : 0.75;
      for (const slot of current.slots) paint(slot, slot.value, current.sides);
    }
  }

  /**
   * Orientation that puts face `index` toward the camera with its label upright.
   * @param {number} index
   */
  function faceQuaternion(index) {
    if (!current) return new THREE.Quaternion();
    const face = current.shape.faces[index];
    const toCamera = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, REST_Y, 0)).normalize();
    const screenRight = new THREE.Vector3(1, 0, 0);
    const screenUp = new THREE.Vector3().crossVectors(toCamera, screenRight).normalize();
    const world = new THREE.Matrix4().makeBasis(screenRight, screenUp, toCamera);
    const right = new THREE.Vector3().crossVectors(face.up, face.normal).normalize();
    const local = new THREE.Matrix4().makeBasis(right, face.up, face.normal).transpose();
    const facing = new THREE.Quaternion().setFromRotationMatrix(world.multiply(local));
    // A slight tilt keeps the landed die reading as a solid instead of a flat badge.
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.24 * state.tiltSide, 0.03 * state.tiltSide));
    return tilt.multiply(facing);
  }

  function layout() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(2.1 / tan, 1.95 / (tan * aspect));
    camera.position.set(0, distance * 0.17, distance);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
    if (state.mode === 'rest') state.targetQuaternion.copy(faceQuaternion(currentFaceIndex()));
    wake();
  }

  function currentFaceIndex() {
    if (!current) return 0;
    if (current.shape.kind === 'coin') return 0;
    return Math.max(0, current.shape.faces.findIndex((face) => face.value === state.result));
  }

  /** @param {number} t seconds since the throw */
  function bounceHeight(t) {
    for (const [start, end, peak] of ARCS) {
      if (t >= start && t < end) {
        const s = (t - start) / (end - start);
        return peak * 4 * s * (1 - s);
      }
    }
    return 0;
  }

  /**
   * @param {number} now seconds
   * @param {number} dt seconds since the previous frame
   */
  function update(now, dt) {
    const time = now;
    if (state.mode === 'idle') {
      const spin = reducedMotion ? 0.6 : time * 0.42;
      const q = new THREE.Quaternion().setFromAxisAngle(idleAxis, spin);
      die.quaternion.copy(q).multiply(idleBase);
      die.position.set(0, REST_Y + (reducedMotion ? 0 : Math.sin(time * 1.3) * 0.08), 0);
    } else if (state.mode === 'rolling') {
      const t = time - state.rollStart;
      const s = clamp01(t / THROW_SECONDS);
      const decay = Math.pow(1 - s, 3);
      const qa = new THREE.Quaternion().setFromAxisAngle(state.spinA, state.turnsA * decay);
      const qb = new THREE.Quaternion().setFromAxisAngle(state.spinB, state.turnsB * decay);
      const spinning = state.targetQuaternion.clone().multiply(qa).multiply(qb);
      die.quaternion.slerpQuaternions(state.fromQuaternion, spinning, smooth(clamp01(t / 0.22)));
      const lift = bounceHeight(t);
      const x = state.drift * (1 - easeOutCubic(clamp01(t / 1.4)));
      const blend = smooth(clamp01(t / 0.2));
      die.position.set(
        THREE.MathUtils.lerp(state.fromPosition.x, x, blend),
        THREE.MathUtils.lerp(state.fromPosition.y, REST_Y + lift, blend),
        0
      );
      // Count impacts to pulse the platform.
      const impacts = ARCS.filter(([, end]) => t >= end).length;
      if (impacts > state.bouncesSeen) {
        state.bouncesSeen = impacts;
        state.pulseStart = time;
        state.pulseStrength = [1, 0.55, 0.25][impacts - 1] ?? 0.2;
      }
      if (current?.shape.kind === 'coin') {
        if (s < 0.82 && time >= state.nextFlicker) {
          paint(current.slots[0], 1 + Math.floor(Math.random() * state.sides), state.sides);
          paint(current.slots[1], 1 + Math.floor(Math.random() * state.sides), state.sides);
          state.nextFlicker = time + 0.05 + s * 0.2;
        } else if (s >= 0.82 && current.slots[0].value !== state.result) {
          current.slots[0].value = state.result;
          paint(current.slots[0], state.result, state.sides);
        }
      }
      if (s >= 1) {
        die.quaternion.copy(state.targetQuaternion);
        state.mode = 'rest';
        state.restSince = time;
        const resolve = state.resolve;
        state.resolve = null;
        resolve?.();
      }
    } else {
      die.quaternion.copy(state.targetQuaternion);
      const since = time - state.restSince;
      const bob = reducedMotion ? 0 : Math.sin(since * 1.2) * 0.035 * smooth(clamp01(since / 1.5));
      die.position.set(0, REST_Y + bob, 0);
    }

    // Platform pulse ring.
    const pulseAge = time - state.pulseStart;
    if (pulseAge < 0.9 && !reducedMotion) {
      const k = pulseAge / 0.9;
      pulse.scale.setScalar(1 + k * 1.2);
      pulse.material.opacity = (1 - k) * 0.8 * state.pulseStrength;
    } else {
      pulse.material.opacity = 0;
    }
    platform.rotation.y = reducedMotion ? 0 : time * 0.05;

    // Hit and miss effects.
    if (current) {
      const accent = new THREE.Color(colors.accent);
      const hot = new THREE.Color(colors.hot);
      const age = time - state.effectStart;
      const edge = current.edgeMaterial.color;
      if (state.effect === 'hit' && age < 1.6) {
        const k = age / 1.6;
        edge.copy(accent).lerp(new THREE.Color(0xffffff), (1 - k) * (colors.dark ? 0.7 : 0.2));
        current.haloMaterial.opacity = (colors.dark ? 0.22 : 0.08) + (1 - k) * 0.5;
        if (!reducedMotion) {
          const positions = burstGeometry.getAttribute('position');
          for (let i = 0; i < BURST * 3; i++) burstPositions[i] += burstVelocity[i] * dt * (1 - k * 0.7);
          positions.needsUpdate = true;
          burstMaterial.opacity = (1 - k) * 0.95;
        }
      } else if (state.effect === 'miss' && age < 1.8) {
        const k = age / 1.8;
        edge.copy(hot).lerp(accent, smooth(clamp01((age - 0.6) / 1.2)));
        current.hiddenMaterial.color.copy(edge);
        if (!reducedMotion && age < 0.45) {
          const jitter = Math.random() < 0.5 ? (Math.random() - 0.5) * 0.12 : 0;
          die.position.x += jitter;
        }
        current.haloMaterial.opacity = (colors.dark ? 0.22 : 0.08) + (1 - k) * 0.25;
      } else if (state.effect) {
        state.effect = null;
        edge.copy(accent);
        current.hiddenMaterial.color.copy(accent);
        current.haloMaterial.opacity = colors.dark ? 0.22 : 0.08;
        burstMaterial.opacity = 0;
      }
    }
  }

  function busy() {
    if (!reducedMotion) return true;
    return state.mode === 'rolling' || state.effect !== null;
  }

  /** @param {number} timestamp */
  function loop(timestamp) {
    frame = 0;
    if (disposed || !active) return;
    const now = timestamp / 1000;
    const dt = last ? Math.min(0.05, now - last) : 0.016;
    last = now;
    update(now, dt);
    renderer.render(scene, camera);
    if (busy()) frame = requestAnimationFrame(loop);
  }

  function wake() {
    if (disposed || !active || frame) return;
    last = 0;
    frame = requestAnimationFrame(loop);
  }

  /** @param {number} sides */
  function setSides(sides) {
    if (current?.sides === sides) return;
    if (current) disposeDie(current);
    current = buildDie(sides);
    state.sides = sides;
    die.add(current.group);
    applyColors();
    if (state.mode !== 'idle') {
      const resolve = state.resolve;
      state.resolve = null;
      resolve?.();
    }
    state.mode = 'idle';
    state.effect = null;
    wake();
  }

  /**
   * Throws the die so it lands on `result`. Resolves once it has landed.
   * @param {number} result
   * @returns {Promise<void>}
   */
  function roll(result) {
    if (!current) return Promise.resolve();
    state.result = result;
    state.effect = null;
    burstMaterial.opacity = 0;
    applyColors();
    if (current.shape.kind === 'coin') {
      current.slots[1].value = 1 + Math.floor(Math.random() * state.sides);
      paint(current.slots[1], current.slots[1].value, state.sides);
    }
    state.tiltSide = Math.random() < 0.5 ? -1 : 1;
    const target = faceQuaternion(currentFaceIndex());
    state.targetQuaternion.copy(target);
    const now = performance.now() / 1000;
    if (reducedMotion) {
      if (current.shape.kind === 'coin') {
        current.slots[0].value = result;
        paint(current.slots[0], result, state.sides);
      }
      state.mode = 'rest';
      state.restSince = now;
      die.quaternion.copy(target);
      wake();
      return Promise.resolve();
    }
    state.fromQuaternion.copy(die.quaternion);
    state.fromPosition.copy(die.position);
    state.spinA.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    state.spinB.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    state.turnsA = Math.PI * 2 * (3 + Math.random() * 1.5);
    state.turnsB = Math.PI * 2 * (0.8 + Math.random());
    state.drift = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.35);
    state.rollStart = now;
    state.bouncesSeen = 0;
    state.nextFlicker = 0;
    state.mode = 'rolling';
    wake();
    return new Promise((resolve) => {
      const previous = state.resolve;
      state.resolve = () => resolve();
      previous?.();
    });
  }

  /** @param {'hit' | 'miss'} kind */
  function effect(kind) {
    state.effect = kind;
    state.effectStart = performance.now() / 1000;
    if (kind === 'hit' && !reducedMotion && current) {
      for (let i = 0; i < BURST; i++) {
        const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        const speed = 1.4 + Math.random() * 2.2;
        burstPositions.set([die.position.x + direction.x * 0.9, die.position.y + direction.y * 0.9, die.position.z + direction.z * 0.9], i * 3);
        burstVelocity.set([direction.x * speed, direction.y * speed, direction.z * speed], i * 3);
      }
      burstGeometry.getAttribute('position').needsUpdate = true;
      state.pulseStart = state.effectStart;
      state.pulseStrength = 1.4;
    }
    wake();
  }

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(host);
  layout();
  setSides(20);

  return {
    setSides,
    roll,
    effect,
    /** @param {DiceColors} next */
    setColors(next) {
      colors = next;
      applyColors();
      wake();
    },
    /** @param {boolean} value */
    setReducedMotion(value) {
      reducedMotion = value;
      wake();
    },
    /** @param {boolean} value */
    setActive(value) {
      active = value;
      if (active) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      state.resolve?.();
      if (current) disposeDie(current);
      platform.traverse((object) => {
        if (object instanceof THREE.Line) object.geometry.dispose();
      });
      for (const material of platformMaterials) material.dispose();
      burstGeometry.dispose();
      burstMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
}

/**
 * @param {string} color any CSS hex colour
 * @param {number} alpha
 */
function withAlpha(color, alpha) {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((ch) => ch + ch).join('') : hex.slice(0, 6);
  const n = Number.parseInt(full, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
