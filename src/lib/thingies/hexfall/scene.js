// three.js scene for Hexfall. This is the only file that imports three, and HexfallGame loads it
// with a dynamic import, so three stays out of every other page. It draws a LevelState and never
// changes it: the simulation lives in sim.js.
import * as THREE from 'three';
import { DIRECTIONS, HEX_STEP, hexCorners, hexDistance, hexKey, hexToWorld, worldToHex } from './hex.js';
import { MODULES, POWER_RANGE, ROCKS } from './data.js';
import { powerSources } from './network.js';

/** @typedef {import('./sim.js').LevelState} LevelState */
/** @typedef {import('./sim.js').Module} Module */
/** @typedef {import('./data.js').ModuleType} ModuleType */

/**
 * Colours read from the page's CSS custom properties, see readColors in HexfallGame.
 * @typedef {object} HexfallColors
 * @property {string} accent
 * @property {string} hot
 * @property {string} ink
 * @property {string} muted
 * @property {string} line
 * @property {string} inset
 * @property {string} spring
 * @property {string} summer
 * @property {string} autumn
 * @property {string} winter
 * @property {boolean} dark
 */

/** @typedef {{ top: number, right: number, bottom: number, left: number }} Insets */
/** @typedef {{ q: number, r: number, ok: boolean, range: number }} Cursor */

const MAX_DPR = 2;
const MIN_DPR = 1;
const ROCK_Y = 0.5; // rocks fly a little above the land so they meet the modules
const FIT_RADIUS = 7.4; // world units around the core that must fit in the free area
const CAMERA_DISTANCE = 60;
const AZIMUTH = THREE.MathUtils.degToRad(32);
const GRAVITY = 14;
const CAPACITY = { rocks: 320, shots: 200, beams: 24, sparks: 520, markers: 96 };
const BEAM_SECONDS = 0.22;
const FLASH_SECONDS = 0.14;

/** Strata layers of a land column, top down. `radius` steps inward so the cut faces read as bands. */
const SLAB = { height: 0.22, radius: 0.985 };
const BAND_A = { height: 0.42, radius: 0.94 };
const BAND_B = { radius: 0.87 };

/** Which season token colours which module type. The gun has no season and uses the accent. */
const TYPE_COLOR = /** @type {Record<ModuleType, 'accent' | 'spring' | 'summer' | 'autumn' | 'winter'>} */ ({
  core: 'accent',
  rivet: 'accent',
  lance: 'autumn',
  mire: 'winter',
  dynamo: 'summer',
  mender: 'spring'
});

/** Drops the alpha pair from `#rrggbbaa`, which THREE.Color cannot read. @param {string} css @param {string} fallback */
function parseColor(css, fallback) {
  const value = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(css) ? css : fallback;
  return new THREE.Color(value.length === 9 ? value.slice(0, 7) : value);
}

/** @param {THREE.Color} a @param {THREE.Color} b @param {number} t */
const mix = (a, b, t) => a.clone().lerp(b, t);

/** Stable pseudo random number in [0, 1) from a hex and a salt, for per hex variation. @param {number} q @param {number} r @param {number} salt */
function hash(q, r, salt) {
  let h = Math.imul(q * 374761393 + r * 668265263 + salt * 2147483647, 1274126177);
  h ^= h >>> 13;
  h = Math.imul(h, 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ colors: HexfallColors, reducedMotion: boolean }} options
 */
export function createHexfallScene(canvas, options) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  scene.add(camera);

  /** Everything with a dispose() that this scene owns. @type {{ dispose(): void }[]} */
  const owned = [];
  /** @template {{ dispose(): void }} T @param {T} item @returns {T} */
  const own = (item) => {
    owned.push(item);
    return item;
  };

  let colors = options.colors;
  let reducedMotion = options.reducedMotion;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let ratioCap = MAX_DPR;
  let deviceRatio = 1;
  let frameAvg = 1 / 60;
  let slowFor = 0;
  let zoom = 40; // CSS px per world unit
  /** @type {Insets} */
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  let clock = 0;
  let shake = 0;
  const cameraBase = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();

  // Lights. Lambert shading keeps the fill rate low on phones.
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-6, 11, 4);
  scene.add(hemisphere, sun);

  // Palette, filled by applyColors.
  const palette = {
    accent: new THREE.Color(),
    hot: new THREE.Color(),
    ink: new THREE.Color(),
    muted: new THREE.Color(),
    inset: new THREE.Color(),
    line: new THREE.Color(),
    top: new THREE.Color(),
    bandA: new THREE.Color(),
    bandB: new THREE.Color(),
    root: new THREE.Color(),
    body: new THREE.Color(),
    flash: new THREE.Color(),
    summer: new THREE.Color(),
    winter: new THREE.Color(),
    /** @type {Record<import('./data.js').RockType, THREE.Color>} */
    rock: { grit: new THREE.Color(), dart: new THREE.Color(), slag: new THREE.Color(), monolith: new THREE.Color() }
  };

  // ---------------------------------------------------------------- geometry

  const prism = own(new THREE.CylinderGeometry(1, 1, 1, 6));
  prism.translate(0, -0.5, 0); // origin on the top face, so a layer hangs below its y position
  const rootShape = own(new THREE.CylinderGeometry(0.82, 0.3, 1, 6));
  rootShape.translate(0, -0.5, 0);
  const rockShape = own(new THREE.IcosahedronGeometry(1, 0));
  const shotShape = own(new THREE.BoxGeometry(0.34, 0.08, 0.08));
  const beamShape = own(new THREE.BoxGeometry(1, 0.09, 0.09));
  beamShape.translate(0.5, 0, 0);
  const sparkShape = own(new THREE.OctahedronGeometry(1, 0));
  const hexRing = own(new THREE.RingGeometry(0.74, 0.9, 6));
  hexRing.rotateX(-Math.PI / 2);
  hexRing.rotateY(Math.PI / 6); // corners toward +z and -z, like the land
  const markerShape = own(new THREE.CircleGeometry(0.2, 6));
  markerShape.rotateX(-Math.PI / 2);
  markerShape.rotateY(Math.PI / 6);
  const rangeRing = own(new THREE.RingGeometry(0.975, 1, 72));
  rangeRing.rotateX(-Math.PI / 2);
  const fieldDisc = own(new THREE.CircleGeometry(1, 48));
  fieldDisc.rotateX(-Math.PI / 2);
  const barShape = own(new THREE.PlaneGeometry(1, 1));

  const parts = {
    plate: own(new THREE.CylinderGeometry(0.6, 0.68, 0.12, 6)),
    corePlate: own(new THREE.CylinderGeometry(0.74, 0.82, 0.2, 6)),
    coreRing: own(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 6)),
    coreGem: own(new THREE.OctahedronGeometry(0.36, 0)),
    turret: own(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 8)),
    head: own(new THREE.BoxGeometry(0.5, 0.24, 0.4)),
    barrel: own(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6)),
    spire: own(new THREE.CylinderGeometry(0.07, 0.28, 1.15, 6)),
    spireTip: own(new THREE.OctahedronGeometry(0.2, 0)),
    spireCollar: own(new THREE.TorusGeometry(0.2, 0.045, 6, 12)),
    dish: own(new THREE.CylinderGeometry(0.56, 0.4, 0.2, 12)),
    halo: own(new THREE.TorusGeometry(0.4, 0.07, 6, 18)),
    drum: own(new THREE.CylinderGeometry(0.32, 0.36, 0.56, 10)),
    coil: own(new THREE.TorusGeometry(0.4, 0.06, 6, 16)),
    bulb: own(new THREE.SphereGeometry(0.17, 10, 8)),
    stub: own(new THREE.CylinderGeometry(0.28, 0.32, 0.3, 8)),
    cross: own(new THREE.BoxGeometry(0.62, 0.17, 0.17))
  };
  parts.barrel.rotateZ(Math.PI / 2);
  parts.barrel.translate(0.42, 0, 0);
  parts.spireCollar.rotateX(Math.PI / 2);
  parts.halo.rotateX(Math.PI / 2);
  parts.coil.rotateX(Math.PI / 2);

  // ---------------------------------------------------------------- materials

  const lambert = (/** @type {THREE.MeshLambertMaterialParameters} */ params = {}) => own(new THREE.MeshLambertMaterial({ flatShading: true, ...params }));
  const basic = (/** @type {THREE.MeshBasicMaterialParameters} */ params = {}) => own(new THREE.MeshBasicMaterial(params));
  const overlay = (/** @type {number} */ opacity) => basic({ transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  const landMaterial = lambert(); // instance colours carry the strata
  const rockMaterial = lambert();
  const shotMaterial = basic();
  const beamMaterial = basic();
  const sparkMaterial = basic();
  const edgeMaterial = own(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 }));
  const markerMaterial = overlay(0.85);
  const cursorMaterial = overlay(0.9);
  const selectMaterial = overlay(0.9);
  const rangeMaterial = overlay(0.7);
  const fieldFillMaterial = overlay(0.08);
  const fieldRingMaterial = overlay(0.45);
  const fieldPulseMaterial = overlay(0.3);
  const barBackMaterial = basic({ transparent: true, opacity: 0.75, depthTest: false });
  const barFillMaterial = basic({ depthTest: false });
  const barLowMaterial = basic({ depthTest: false });
  const debrisMaterials = { top: lambert(), bandA: lambert(), root: lambert() };
  const bodyMaterial = { on: lambert(), off: lambert() };
  /** @type {Record<ModuleType, { on: THREE.MeshLambertMaterial, off: THREE.MeshLambertMaterial }>} */
  const trimMaterial = {
    core: { on: lambert(), off: lambert() },
    rivet: { on: lambert(), off: lambert() },
    lance: { on: lambert(), off: lambert() },
    mire: { on: lambert(), off: lambert() },
    dynamo: { on: lambert(), off: lambert() },
    mender: { on: lambert(), off: lambert() }
  };

  // ---------------------------------------------------------------- backdrop

  /** Two layers of stars fixed to the camera, far behind the island. @param {number} count @param {number} size @param {number} salt */
  function starLayer(count, size, salt) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (hash(i, salt, 1) - 0.5) * 120;
      positions[i * 3 + 1] = (hash(i, salt, 2) - 0.5) * 120;
      positions[i * 3 + 2] = -300 - hash(i, salt, 3) * 40;
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = own(new THREE.PointsMaterial({ size, sizeAttenuation: false, transparent: true, depthWrite: false }));
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -10;
    camera.add(points);
    return { points, material };
  }
  const stars = [starLayer(320, 1.6, 11), starLayer(90, 2.8, 23)];

  // ---------------------------------------------------------------- instanced things

  /** @param {THREE.BufferGeometry} geometry @param {THREE.Material} material @param {number} capacity */
  function instanced(geometry, material, capacity) {
    const mesh = own(new THREE.InstancedMesh(geometry, material, capacity));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, new THREE.Color(1, 1, 1)); // allocates the colour buffer
    mesh.count = 0;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  }

  const rockMesh = instanced(rockShape, rockMaterial, CAPACITY.rocks);
  const shotMesh = instanced(shotShape, shotMaterial, CAPACITY.shots);
  const beamMesh = instanced(beamShape, beamMaterial, CAPACITY.beams);
  const sparkMesh = instanced(sparkShape, sparkMaterial, CAPACITY.sparks);
  const markerMesh = instanced(markerShape, markerMaterial, CAPACITY.markers);
  markerMesh.renderOrder = 2;

  /** Land layers, sized per level in reset(). @type {{ slab: THREE.InstancedMesh, bandA: THREE.InstancedMesh, bandB: THREE.InstancedMesh, root: THREE.InstancedMesh } | null} */
  let landMesh = null;
  let landCapacity = 0;

  const edgeGeometry = own(new THREE.BufferGeometry());
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edges.frustumCulled = false;
  edges.renderOrder = 1;
  scene.add(edges);

  const cursorMesh = new THREE.Mesh(hexRing, cursorMaterial);
  const selectMesh = new THREE.Mesh(hexRing, selectMaterial);
  const rangeMesh = new THREE.Mesh(rangeRing, rangeMaterial);
  for (const mesh of [cursorMesh, selectMesh, rangeMesh]) {
    mesh.visible = false;
    mesh.renderOrder = 3;
    scene.add(mesh);
  }

  // ---------------------------------------------------------------- per level state

  /**
   * Fixed look of one land column, worked out once per level.
   * @typedef {{ q: number, r: number, x: number, z: number, bandB: number, root: number, tint: number, turn: number }} LandLook
   */
  /** @type {Map<string, LandLook>} */
  const landLook = new Map();
  /** @type {string[]} keys in instance order */
  let landOrder = [];
  /** @type {Map<string, number>} seconds of impact flash left per hex */
  const landFlash = new Map();
  /** @type {Map<number, number>} seconds of hit flash left per rock id */
  const rockFlash = new Map();

  /**
   * @typedef {object} ModuleView
   * @property {Module} module
   * @property {THREE.Group} group
   * @property {THREE.Mesh[]} meshes
   * @property {THREE.Object3D | null} head turns to aim
   * @property {THREE.Object3D | null} spinner turns or bobs while online
   * @property {THREE.Group} bar
   * @property {THREE.Mesh} barFill
   * @property {{ group: THREE.Group, pulse: THREE.Mesh } | null} field
   * @property {boolean | null} online last drawn state
   * @property {number} hit impact pulse, 1 falling to 0
   * @property {number} grow build in animation, 0 rising to 1
   */
  /** @type {Map<number, ModuleView>} */
  const moduleViews = new Map();

  /** @type {{ object: THREE.Object3D, velocity: THREE.Vector3, axis: THREE.Vector3, spin: number, life: number, span: number }[]} */
  const debris = [];

  const sparks = {
    position: new Float32Array(CAPACITY.sparks * 3),
    velocity: new Float32Array(CAPACITY.sparks * 3),
    life: new Float32Array(CAPACITY.sparks),
    span: new Float32Array(CAPACITY.sparks),
    size: new Float32Array(CAPACITY.sparks),
    color: new Float32Array(CAPACITY.sparks * 3),
    next: 0
  };

  /** @type {{ x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, life: number }[]} */
  const beams = [];

  /** @type {LevelState | null} */
  let current = null;
  let landVersion = -1;
  let moduleVersion = -1;
  let markersDirty = true;
  /** @type {ModuleType | null} */
  let buildType = null;
  /** @type {Cursor | null} */
  let cursor = null;
  /** @type {{ q: number, r: number, range: number } | null} */
  let selection = null;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const tint = new THREE.Color();
  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const direction = new THREE.Vector3();
  const ndc = new THREE.Vector3();

  // ---------------------------------------------------------------- colours

  function applyColors() {
    const dark = colors.dark;
    palette.accent.copy(parseColor(colors.accent, '#6ff1f5'));
    palette.hot.copy(parseColor(colors.hot, '#ff6fae'));
    palette.ink.copy(parseColor(colors.ink, dark ? '#e6f6f8' : '#17303b'));
    palette.muted.copy(parseColor(colors.muted, dark ? '#8fb0ba' : '#3e5662'));
    palette.inset.copy(parseColor(colors.inset, dark ? '#06121a' : '#d2e2e4'));
    palette.line.copy(parseColor(colors.line, dark ? '#7fd8e0' : '#4f828c'));
    palette.summer.copy(parseColor(colors.summer, '#ffd166'));
    palette.winter.copy(parseColor(colors.winter, '#79c4ff'));
    const seasons = {
      accent: palette.accent,
      spring: parseColor(colors.spring, '#7be39b'),
      summer: palette.summer,
      autumn: parseColor(colors.autumn, '#ff8a5b'),
      winter: palette.winter
    };

    // The island is the inset colour pulled toward the muted text colour. In dark mode more muted
    // means lighter, in light mode darker, so the strata get darker going down in both themes.
    const shares = dark ? [0.46, 0.32, 0.23, 0.14] : [0.32, 0.46, 0.58, 0.7];
    palette.top.copy(mix(palette.inset, palette.muted, shares[0]));
    palette.bandA.copy(mix(palette.inset, palette.muted, shares[1]).lerp(palette.accent, 0.1));
    palette.bandB.copy(mix(palette.inset, palette.muted, shares[2]).lerp(palette.hot, 0.07));
    palette.root.copy(mix(palette.inset, palette.muted, shares[3]));
    palette.body.copy(dark ? mix(palette.inset, palette.ink, 0.62) : mix(palette.ink, palette.inset, 0.16));
    palette.flash.copy(dark ? new THREE.Color(0xffffff) : palette.ink);

    palette.rock.grit.copy(palette.hot);
    palette.rock.dart.copy(mix(palette.hot, dark ? new THREE.Color(0xffffff) : palette.summer, 0.4));
    palette.rock.slag.copy(mix(palette.hot, dark ? palette.inset : palette.ink, 0.62));
    palette.rock.monolith.copy(mix(palette.hot, dark ? palette.inset : palette.ink, 0.38));

    hemisphere.color.set(dark ? 0xcfe9f2 : 0xffffff);
    hemisphere.groundColor.copy(mix(palette.inset, palette.accent, dark ? 0.25 : 0.1));
    hemisphere.intensity = dark ? 1.5 : 2.1;
    sun.intensity = dark ? 2.3 : 1.7;

    rockMaterial.emissive.copy(palette.hot).multiplyScalar(dark ? 0.16 : 0.05);
    shotMaterial.color.copy(dark ? mix(palette.accent, new THREE.Color(0xffffff), 0.35) : palette.accent);
    beamMaterial.color.copy(seasons.autumn);
    edgeMaterial.color.copy(palette.line);
    edgeMaterial.opacity = dark ? 0.55 : 0.6;
    cursorMaterial.color.copy(palette.accent);
    selectMaterial.color.copy(dark ? new THREE.Color(0xffffff) : palette.ink);
    rangeMaterial.color.copy(palette.accent);
    fieldFillMaterial.color.copy(palette.winter);
    fieldRingMaterial.color.copy(palette.winter);
    fieldPulseMaterial.color.copy(palette.winter);
    fieldFillMaterial.opacity = dark ? 0.09 : 0.14;
    barBackMaterial.color.copy(dark ? palette.inset : palette.ink);
    barFillMaterial.color.copy(palette.accent);
    barLowMaterial.color.copy(palette.hot);

    debrisMaterials.top.color.copy(palette.top);
    debrisMaterials.bandA.color.copy(palette.bandA);
    debrisMaterials.root.color.copy(palette.root);

    bodyMaterial.on.color.copy(palette.body);
    bodyMaterial.off.color.copy(mix(palette.body, palette.top, 0.72));
    for (const type of /** @type {ModuleType[]} */ (Object.keys(trimMaterial))) {
      const base = seasons[TYPE_COLOR[type]];
      trimMaterial[type].on.color.copy(base);
      trimMaterial[type].on.emissive.copy(base).multiplyScalar(dark ? 0.55 : 0.12);
      trimMaterial[type].off.color.copy(mix(base, palette.top, 0.78));
      trimMaterial[type].off.emissive.setScalar(0);
    }

    for (const [i, layer] of stars.entries()) {
      layer.material.color.copy(dark ? palette.ink : palette.muted);
      layer.material.opacity = (dark ? 0.75 : 0.4) * (i === 0 ? 0.6 : 1);
    }
    landVersion = -1; // repaint the land with the new palette
    markersDirty = true;
  }

  // ---------------------------------------------------------------- camera

  function fitCamera() {
    const portrait = height > width * 1.05;
    const elevation = THREE.MathUtils.degToRad(portrait ? 52 : 40);
    const freeW = Math.max(160, width - insets.left - insets.right);
    const freeH = Math.max(160, height - insets.top - insets.bottom);
    // A circle on the ground projects to an ellipse; modules above and strata below need extra room.
    const needW = FIT_RADIUS * 2;
    const needH = FIT_RADIUS * 2 * Math.sin(elevation) + 2.6;
    zoom = Math.max(12, Math.min(freeW / needW, freeH / needH, 84));

    const cx = insets.left + freeW / 2 - width / 2;
    const cy = insets.top + freeH / 2 - height / 2;
    camera.left = (-width / 2 - cx) / zoom;
    camera.right = (width / 2 - cx) / zoom;
    camera.top = (height / 2 + cy) / zoom;
    camera.bottom = (-height / 2 + cy) / zoom;
    camera.updateProjectionMatrix();

    const target = new THREE.Vector3(0, -0.5, 0);
    cameraBase.set(Math.sin(AZIMUTH) * Math.cos(elevation), Math.sin(elevation), Math.cos(AZIMUTH) * Math.cos(elevation)).multiplyScalar(CAMERA_DISTANCE).add(target);
    camera.position.copy(cameraBase);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    for (const view of moduleViews.values()) view.bar.quaternion.copy(camera.quaternion);
  }

  function applySize() {
    dpr = Math.max(MIN_DPR, Math.min(deviceRatio, ratioCap));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    fitCamera();
  }

  /**
   * Drops the pixel ratio a step when frames stay slow, as the orb scene does.
   * @param {number} dt seconds since the previous frame
   */
  function adaptQuality(dt) {
    frameAvg += (dt - frameAvg) * 0.05;
    slowFor = frameAvg > 1 / 45 ? slowFor + dt : 0;
    if (slowFor > 1.5 && dpr > MIN_DPR) {
      ratioCap = Math.max(MIN_DPR, dpr - 0.25);
      slowFor = 0;
      frameAvg = 1 / 60;
      applySize();
    }
  }

  // ---------------------------------------------------------------- land

  /** @param {LevelState} state */
  function buildLand(state) {
    if (landMesh && landCapacity < state.land.size) {
      for (const mesh of Object.values(landMesh)) {
        mesh.removeFromParent();
        mesh.dispose();
        owned.splice(owned.indexOf(mesh), 1);
      }
      landMesh = null;
    }
    if (!landMesh) {
      landCapacity = Math.max(state.land.size, 37);
      landMesh = {
        slab: instanced(prism, landMaterial, landCapacity),
        bandA: instanced(prism, landMaterial, landCapacity),
        bandB: instanced(prism, landMaterial, landCapacity),
        root: instanced(rootShape, landMaterial, landCapacity)
      };
      edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(landCapacity * 36), 3));
    }
    landLook.clear();
    for (const land of state.land.values()) {
      const world = hexToWorld(land.q, land.r);
      const depth = Math.max(0, 3 - hexDistance(land, { q: 0, r: 0 }));
      landLook.set(hexKey(land.q, land.r), {
        q: land.q,
        r: land.r,
        x: world.x,
        z: world.y,
        bandB: 0.34 + hash(land.q, land.r, 1) * 0.34,
        root: 0.5 + hash(land.q, land.r, 2) * 0.9 + depth * 0.42,
        tint: hash(land.q, land.r, 3),
        turn: Math.floor(hash(land.q, land.r, 4) * 6) * (Math.PI / 3)
      });
    }
  }

  /** Writes the instance matrices for the hexes that still exist. @param {LevelState} state */
  function syncLand(state) {
    if (!landMesh) return;
    landOrder = [];
    const edgePositions = /** @type {THREE.BufferAttribute} */ (edgeGeometry.getAttribute('position'));
    let i = 0;
    let e = 0;
    for (const land of state.land.values()) {
      const key = hexKey(land.q, land.r);
      const look = landLook.get(key);
      if (!look) continue;
      landOrder.push(key);
      let y = 0;
      matrix.compose(position.set(look.x, y, look.z), quaternion.identity(), scale.set(SLAB.radius, SLAB.height, SLAB.radius));
      landMesh.slab.setMatrixAt(i, matrix);
      y -= SLAB.height;
      matrix.compose(position.set(look.x, y, look.z), quaternion.identity(), scale.set(BAND_A.radius, BAND_A.height, BAND_A.radius));
      landMesh.bandA.setMatrixAt(i, matrix);
      y -= BAND_A.height;
      matrix.compose(position.set(look.x, y, look.z), quaternion.identity(), scale.set(BAND_B.radius, look.bandB, BAND_B.radius));
      landMesh.bandB.setMatrixAt(i, matrix);
      y -= look.bandB;
      quaternion.setFromEuler(euler.set(0, look.turn, 0));
      matrix.compose(position.set(look.x, y, look.z), quaternion, scale.set(1, look.root, 1));
      landMesh.root.setMatrixAt(i, matrix);

      landMesh.bandA.setColorAt(i, tint.copy(palette.bandA).multiplyScalar(0.94 + look.tint * 0.12));
      landMesh.bandB.setColorAt(i, tint.copy(palette.bandB).multiplyScalar(0.9 + look.tint * 0.2));
      landMesh.root.setColorAt(i, tint.copy(palette.root).multiplyScalar(0.9 + look.tint * 0.2));

      const corners = hexCorners(land.q, land.r, SLAB.radius);
      for (let c = 0; c < 6; c++) {
        const a = corners[c];
        const b = corners[(c + 1) % 6];
        edgePositions.setXYZ(e++, a.x, 0.004, a.y);
        edgePositions.setXYZ(e++, b.x, 0.004, b.y);
      }
      i++;
    }
    for (const mesh of Object.values(landMesh)) {
      mesh.count = i;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    edgePositions.needsUpdate = true;
    edgeGeometry.setDrawRange(0, e);
  }

  /** Top face colours follow land health and impact flashes. @param {LevelState} state @param {number} dt */
  function paintLand(state, dt) {
    if (!landMesh) return;
    for (let i = 0; i < landOrder.length; i++) {
      const key = landOrder[i];
      const land = state.land.get(key);
      const look = landLook.get(key);
      if (!land || !look) continue;
      tint.copy(palette.top).multiplyScalar(0.94 + look.tint * 0.12);
      const wear = 1 - land.hp / land.maxHp;
      if (wear > 0) tint.lerp(palette.hot, wear * 0.55);
      const flash = landFlash.get(key);
      if (flash) {
        tint.lerp(palette.hot, Math.min(1, flash / FLASH_SECONDS));
        if (flash - dt <= 0) landFlash.delete(key);
        else landFlash.set(key, flash - dt);
      }
      landMesh.slab.setColorAt(i, tint);
    }
    if (landMesh.slab.instanceColor) landMesh.slab.instanceColor.needsUpdate = true;
  }

  /** A broken hex tumbles into the void. @param {string} key */
  function dropLand(key) {
    const look = landLook.get(key);
    if (!look || reducedMotion) return;
    const group = new THREE.Group();
    const slab = new THREE.Mesh(prism, debrisMaterials.top);
    slab.scale.set(SLAB.radius, SLAB.height, SLAB.radius);
    const band = new THREE.Mesh(prism, debrisMaterials.bandA);
    band.position.y = -SLAB.height;
    band.scale.set(BAND_A.radius, BAND_A.height + look.bandB, BAND_A.radius);
    const root = new THREE.Mesh(rootShape, debrisMaterials.root);
    root.position.y = -SLAB.height - BAND_A.height - look.bandB;
    root.scale.set(1, look.root, 1);
    group.add(slab, band, root);
    group.position.set(look.x, 0, look.z);
    scene.add(group);
    const away = Math.hypot(look.x, look.z) || 1;
    debris.push({
      object: group,
      velocity: new THREE.Vector3((look.x / away) * 0.9, -0.6, (look.z / away) * 0.9),
      axis: new THREE.Vector3(hash(look.q, look.r, 5) - 0.5, hash(look.q, look.r, 6) * 0.3, hash(look.q, look.r, 7) - 0.5).normalize(),
      spin: 0.8 + hash(look.q, look.r, 8) * 1.6,
      life: 0,
      span: 2.4
    });
  }

  // ---------------------------------------------------------------- modules

  /** @param {ModuleType} type @returns {{ meshes: THREE.Mesh[], head: THREE.Object3D | null, spinner: THREE.Object3D | null, barY: number }} */
  function buildModuleParts(type) {
    /** @type {THREE.Mesh[]} */
    const meshes = [];
    /** @param {THREE.BufferGeometry} geometry @param {'body' | 'trim'} kind @param {number} y */
    const part = (geometry, kind, y) => {
      const mesh = new THREE.Mesh(geometry, bodyMaterial.on);
      mesh.userData.kind = kind;
      mesh.position.y = y;
      meshes.push(mesh);
      return mesh;
    };
    /** @type {THREE.Object3D | null} */
    let head = null;
    /** @type {THREE.Object3D | null} */
    let spinner = null;
    let barY = 1.25;
    if (type === 'core') {
      part(parts.corePlate, 'body', 0.1);
      part(parts.coreRing, 'body', 0.35);
      spinner = part(parts.coreGem, 'trim', 0.98);
      barY = 1.7;
    } else {
      part(parts.plate, 'body', 0.06);
    }
    if (type === 'rivet') {
      part(parts.turret, 'body', 0.27);
      head = new THREE.Group();
      head.position.y = 0.54;
      const box = part(parts.head, 'trim', 0);
      const barrel = part(parts.barrel, 'body', 0);
      head.add(box, barrel);
    } else if (type === 'lance') {
      part(parts.spire, 'body', 0.69);
      part(parts.spireCollar, 'trim', 0.78);
      spinner = part(parts.spireTip, 'trim', 1.46);
      barY = 2;
    } else if (type === 'mire') {
      part(parts.dish, 'body', 0.22);
      spinner = part(parts.halo, 'trim', 0.56);
    } else if (type === 'dynamo') {
      part(parts.drum, 'body', 0.4);
      part(parts.coil, 'trim', 0.3);
      part(parts.coil, 'trim', 0.52);
      spinner = part(parts.bulb, 'trim', 0.84);
    } else if (type === 'mender') {
      part(parts.stub, 'body', 0.27);
      spinner = new THREE.Group();
      spinner.position.y = 0.7;
      const a = part(parts.cross, 'trim', 0);
      const b = part(parts.cross, 'trim', 0);
      b.rotation.y = Math.PI / 2;
      spinner.add(a, b);
    }
    return { meshes, head, spinner, barY };
  }

  /** @param {Module} module @returns {ModuleView} */
  function createModuleView(module) {
    const group = new THREE.Group();
    const built = buildModuleParts(module.type);
    for (const mesh of built.meshes) if (!mesh.parent) group.add(mesh);
    if (built.head) group.add(built.head);
    if (built.spinner && !built.spinner.parent) group.add(built.spinner);
    const world = hexToWorld(module.q, module.r);
    group.position.set(world.x, 0, world.y);

    const bar = new THREE.Group();
    const back = new THREE.Mesh(barShape, barBackMaterial);
    back.scale.set(0.96, 0.13, 1);
    const fill = new THREE.Mesh(barShape, barFillMaterial);
    fill.scale.set(0.9, 0.07, 1);
    back.renderOrder = 20;
    fill.renderOrder = 21;
    bar.add(back, fill);
    bar.position.y = built.barY;
    bar.quaternion.copy(camera.quaternion);
    bar.visible = false;
    group.add(bar);

    /** @type {ModuleView['field']} */
    let field = null;
    const def = MODULES[module.type];
    if (def.slow && def.range) {
      const radius = def.range * HEX_STEP;
      const fieldGroup = new THREE.Group();
      const disc = new THREE.Mesh(fieldDisc, fieldFillMaterial);
      disc.scale.setScalar(radius);
      const rim = new THREE.Mesh(rangeRing, fieldRingMaterial);
      rim.scale.setScalar(radius);
      const pulse = new THREE.Mesh(rangeRing, fieldPulseMaterial);
      fieldGroup.add(disc, rim, pulse);
      fieldGroup.position.set(world.x, 0.03, world.y);
      for (const mesh of [disc, rim, pulse]) mesh.renderOrder = 2;
      scene.add(fieldGroup);
      field = { group: fieldGroup, pulse };
    }

    scene.add(group);
    return { module, group, meshes: built.meshes, head: built.head, spinner: built.spinner, bar, barFill: fill, field, online: null, hit: 0, grow: reducedMotion ? 1 : 0 };
  }

  /** @param {ModuleView} view */
  function removeModuleView(view) {
    view.group.removeFromParent();
    view.field?.group.removeFromParent();
    moduleViews.delete(view.module.id);
  }

  /** @param {LevelState} state @param {Set<string>} lostKeys hexes whose module was destroyed this frame */
  function syncModules(state, lostKeys) {
    const seen = new Set();
    for (const module of state.modules.values()) {
      seen.add(module.id);
      if (!moduleViews.has(module.id)) moduleViews.set(module.id, createModuleView(module));
    }
    for (const view of [...moduleViews.values()]) {
      if (seen.has(view.module.id)) continue;
      const destroyed = lostKeys.has(hexKey(view.module.q, view.module.r));
      if (destroyed && !reducedMotion) {
        // The wreck is thrown clear and shrinks away; its field and bar go at once.
        view.field?.group.removeFromParent();
        view.bar.visible = false;
        moduleViews.delete(view.module.id);
        const away = Math.hypot(view.group.position.x, view.group.position.z) || 1;
        debris.push({
          object: view.group,
          velocity: new THREE.Vector3((view.group.position.x / away) * 1.6, 3.2, (view.group.position.z / away) * 1.6),
          axis: new THREE.Vector3(hash(view.module.q, view.module.r, 9) - 0.5, 0.2, hash(view.module.q, view.module.r, 10) - 0.5).normalize(),
          spin: 5,
          life: 0,
          span: 1.1
        });
      } else {
        removeModuleView(view);
      }
    }
    markersDirty = true;
  }

  /** @param {number} dt @param {number} motion 1 normally, 0 with reduced motion */
  function animateModules(dt, motion) {
    for (const view of moduleViews.values()) {
      const { module } = view;
      if (view.online !== module.online) {
        view.online = module.online;
        const state = module.online ? 'on' : 'off';
        for (const mesh of view.meshes) mesh.material = mesh.userData.kind === 'trim' ? trimMaterial[module.type][state] : bodyMaterial[state];
        if (view.field) view.field.group.visible = module.online;
      }
      view.hit = Math.max(0, view.hit - dt * 5);
      view.grow = Math.min(1, view.grow + dt * 6);
      const eased = 1 - (1 - view.grow) ** 3;
      view.group.scale.setScalar(eased * (1 + view.hit * 0.14 * motion));

      if (view.head) view.head.rotation.y = -module.aim;
      if (view.spinner && module.online && motion) {
        if (module.type === 'core') {
          view.spinner.rotation.y += dt * 0.9;
          view.spinner.position.y = 0.98 + Math.sin(clock * 1.6) * 0.06;
        } else if (module.type === 'lance') {
          view.spinner.rotation.y += dt * 1.4;
        } else if (module.type === 'mire') {
          view.spinner.position.y = 0.56 + Math.sin(clock * 2 + module.id) * 0.05;
        } else if (module.type === 'dynamo') {
          view.spinner.scale.setScalar(1 + Math.sin(clock * 5 + module.id) * 0.12);
        } else if (module.type === 'mender') {
          view.spinner.rotation.y += dt * 1.2;
        }
      }

      const ratio = Math.max(0, module.hp / module.maxHp);
      view.bar.visible = ratio < 0.999;
      if (view.bar.visible) {
        view.barFill.scale.x = 0.9 * ratio;
        view.barFill.position.x = -0.45 * (1 - ratio);
        view.barFill.material = ratio < 0.35 ? barLowMaterial : barFillMaterial;
      }

      if (view.field && module.online) {
        const radius = (MODULES[module.type].range ?? 1) * HEX_STEP;
        const phase = motion ? (clock * 0.45 + module.id * 0.37) % 1 : 0.6;
        view.field.pulse.scale.setScalar(Math.max(0.05, radius * (1 - phase)));
      }
    }
  }

  // ---------------------------------------------------------------- markers, cursor, selection

  /** Dots on every hex that can take a module: accent when powered, the Dynamo colour when not. @param {LevelState} state */
  function syncMarkers(state) {
    markersDirty = false;
    let i = 0;
    if (buildType && (state.phase === 'build' || state.phase === 'wave')) {
      const sources = powerSources(state.modules);
      for (const land of state.land.values()) {
        const key = hexKey(land.q, land.r);
        if (state.modules.has(key) || i >= CAPACITY.markers) continue;
        if (!DIRECTIONS.some((d) => state.modules.has(hexKey(land.q + d.q, land.r + d.r)))) continue;
        const powered = MODULES[buildType].source || sources.some((source) => hexDistance(source, land) <= POWER_RANGE);
        const world = hexToWorld(land.q, land.r);
        matrix.makeTranslation(world.x, 0.02, world.y);
        markerMesh.setMatrixAt(i, matrix);
        markerMesh.setColorAt(i, powered ? palette.accent : palette.summer);
        i++;
      }
    }
    markerMesh.count = i;
    markerMesh.instanceMatrix.needsUpdate = true;
    if (markerMesh.instanceColor) markerMesh.instanceColor.needsUpdate = true;
  }

  function syncCursor() {
    const shown = cursor ?? null;
    cursorMesh.visible = shown !== null;
    if (shown) {
      const world = hexToWorld(shown.q, shown.r);
      cursorMesh.position.set(world.x, 0.03, world.y);
      cursorMaterial.color.copy(shown.ok ? palette.accent : palette.hot);
    }
    selectMesh.visible = selection !== null;
    if (selection) {
      const world = hexToWorld(selection.q, selection.r);
      selectMesh.position.set(world.x, 0.035, world.y);
    }
    const ranged = shown && shown.ok && shown.range > 0 ? shown : selection && selection.range > 0 ? selection : null;
    rangeMesh.visible = ranged !== null;
    if (ranged) {
      const world = hexToWorld(ranged.q, ranged.r);
      rangeMesh.position.set(world.x, 0.04, world.y);
      rangeMesh.scale.setScalar(ranged.range * HEX_STEP);
    }
  }

  // ---------------------------------------------------------------- effects

  /**
   * @param {number} x @param {number} y @param {number} z
   * @param {number} count @param {THREE.Color} color @param {number} speed @param {number} size
   */
  function burst(x, y, z, count, color, speed, size) {
    if (reducedMotion) count = Math.min(count, 2);
    for (let n = 0; n < count; n++) {
      const i = sparks.next;
      sparks.next = (sparks.next + 1) % CAPACITY.sparks;
      const angle = Math.random() * Math.PI * 2;
      const lift = Math.random();
      const v = speed * (0.4 + Math.random() * 0.8);
      sparks.position.set([x, y, z], i * 3);
      sparks.velocity.set([Math.cos(angle) * v, lift * v * 1.3, Math.sin(angle) * v], i * 3);
      sparks.span[i] = 0.3 + Math.random() * 0.35;
      sparks.life[i] = sparks.span[i];
      sparks.size[i] = size * (0.6 + Math.random() * 0.8);
      sparks.color.set([color.r, color.g, color.b], i * 3);
    }
  }

  /** @param {number} dt */
  function updateSparks(dt) {
    let count = 0;
    for (let i = 0; i < CAPACITY.sparks; i++) {
      if (sparks.life[i] <= 0) continue;
      sparks.life[i] -= dt;
      if (sparks.life[i] <= 0) continue;
      const o = i * 3;
      sparks.velocity[o + 1] -= GRAVITY * 0.5 * dt;
      sparks.position[o] += sparks.velocity[o] * dt;
      sparks.position[o + 1] += sparks.velocity[o + 1] * dt;
      sparks.position[o + 2] += sparks.velocity[o + 2] * dt;
      const k = sparks.life[i] / sparks.span[i];
      matrix.compose(position.set(sparks.position[o], sparks.position[o + 1], sparks.position[o + 2]), quaternion.identity(), scale.setScalar(sparks.size[i] * k));
      sparkMesh.setMatrixAt(count, matrix);
      sparkMesh.setColorAt(count, tint.setRGB(sparks.color[o], sparks.color[o + 1], sparks.color[o + 2]));
      count++;
    }
    sparkMesh.count = count;
    sparkMesh.instanceMatrix.needsUpdate = true;
    if (sparkMesh.instanceColor) sparkMesh.instanceColor.needsUpdate = true;
  }

  /** @param {number} dt */
  function updateBeams(dt) {
    let count = 0;
    for (let i = beams.length - 1; i >= 0; i--) {
      const beam = beams[i];
      beam.life -= dt;
      if (beam.life <= 0) {
        beams.splice(i, 1);
        continue;
      }
      if (count >= CAPACITY.beams) continue;
      direction.set(beam.x2 - beam.x1, beam.y2 - beam.y1, beam.z2 - beam.z1);
      const length = direction.length() || 1;
      quaternion.setFromUnitVectors(X_AXIS, direction.multiplyScalar(1 / length));
      const thickness = 0.4 + 1.6 * (beam.life / BEAM_SECONDS);
      matrix.compose(position.set(beam.x1, beam.y1, beam.z1), quaternion, scale.set(length, thickness, thickness));
      beamMesh.setMatrixAt(count++, matrix);
    }
    beamMesh.count = count;
    beamMesh.instanceMatrix.needsUpdate = true;
  }

  /** @param {number} dt */
  function updateDebris(dt) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const piece = debris[i];
      piece.life += dt;
      if (piece.life >= piece.span) {
        piece.object.removeFromParent();
        debris.splice(i, 1);
        continue;
      }
      piece.velocity.y -= GRAVITY * dt;
      piece.object.position.addScaledVector(piece.velocity, dt);
      piece.object.rotateOnAxis(piece.axis, piece.spin * dt);
      // An orthographic camera has no depth cue, so the piece shrinks as it falls away.
      const k = piece.life / piece.span;
      piece.object.scale.setScalar(Math.max(0.001, 1 - k * k));
    }
  }

  /** @param {LevelState} state @param {number} ahead seconds of simulated time not yet stepped */
  function drawRocks(state, ahead) {
    let i = 0;
    for (const rock of state.rocks) {
      if (i >= CAPACITY.rocks) break;
      const travel = rock.speed * (1 - rock.slow) * ahead;
      const x = rock.x + rock.dx * travel;
      const z = rock.y + rock.dy * travel;
      const def = ROCKS[rock.type];
      const spin = reducedMotion ? 0 : clock * (0.6 + (rock.id % 7) * 0.22);
      if (rock.type === 'dart') {
        // Fast rocks are stretched along their path so they read as streaks.
        quaternion.setFromEuler(euler.set(spin * 2, -Math.atan2(rock.dy, rock.dx), 0, 'YXZ'));
        scale.set(def.radius * 2.3, def.radius * 0.8, def.radius * 0.8);
      } else {
        quaternion.setFromEuler(euler.set(spin + rock.id, spin * 0.7 + rock.id * 2, rock.id * 3));
        const lump = 0.86 + ((rock.id * 37) % 10) * 0.03;
        scale.set(def.radius * lump, def.radius, def.radius * (1.9 - lump));
      }
      matrix.compose(position.set(x, ROCK_Y + (rock.type === 'monolith' ? 0.35 : 0), z), quaternion, scale);
      rockMesh.setMatrixAt(i, matrix);
      tint.copy(palette.rock[rock.type]);
      if (rock.slow > 0) tint.lerp(palette.winter, 0.45);
      const flash = rockFlash.get(rock.id);
      if (flash) tint.lerp(palette.flash, Math.min(1, flash / FLASH_SECONDS) * 0.8);
      rockMesh.setColorAt(i, tint);
      i++;
    }
    rockMesh.count = i;
    rockMesh.instanceMatrix.needsUpdate = true;
    if (rockMesh.instanceColor) rockMesh.instanceColor.needsUpdate = true;
  }

  /** @param {LevelState} state @param {number} ahead */
  function drawShots(state, ahead) {
    let i = 0;
    for (const shot of state.shots) {
      if (i >= CAPACITY.shots) break;
      quaternion.setFromEuler(euler.set(0, -Math.atan2(shot.dy, shot.dx), 0));
      matrix.compose(position.set(shot.x + shot.dx * shot.speed * ahead, ROCK_Y + 0.05, shot.y + shot.dy * shot.speed * ahead), quaternion, scale.set(1, 1, 1));
      shotMesh.setMatrixAt(i++, matrix);
    }
    shotMesh.count = i;
    shotMesh.instanceMatrix.needsUpdate = true;
  }

  /** @param {LevelState} state @returns {Set<string>} hexes that lost a module */
  function readEvents(state) {
    /** @type {Set<string>} */
    const lost = new Set();
    for (const event of state.events) {
      switch (event.kind) {
        case 'impact': {
          const key = hexKey(event.q, event.r);
          if (event.on === 'land') landFlash.set(key, FLASH_SECONDS);
          else for (const view of moduleViews.values()) if (view.module.q === event.q && view.module.r === event.r) view.hit = 1;
          burst(event.x, ROCK_Y, event.y, 7, palette.hot, 3.2, 0.11);
          shake = Math.min(0.5, shake + 0.05 + event.amount * 0.004);
          break;
        }
        case 'landLost':
          dropLand(hexKey(event.q, event.r));
          shake = Math.min(0.5, shake + 0.14);
          break;
        case 'moduleLost': {
          lost.add(hexKey(event.q, event.r));
          const world = hexToWorld(event.q, event.r);
          burst(world.x, 0.5, world.y, 16, palette.hot, 4.5, 0.14);
          shake = Math.min(0.6, shake + 0.2);
          break;
        }
        case 'rockHit':
          rockFlash.set(event.id, FLASH_SECONDS);
          break;
        case 'rockDead':
          burst(event.x, ROCK_Y, event.y, event.rock === 'monolith' ? 40 : 6, palette.rock[event.rock], event.rock === 'monolith' ? 6 : 2.6, event.rock === 'monolith' ? 0.2 : 0.09);
          if (event.rock === 'monolith') shake = Math.min(0.6, shake + 0.25);
          break;
        case 'beam':
          beams.push({ x1: event.x1, y1: 1.46, z1: event.y1, x2: event.x2, y2: ROCK_Y, z2: event.y2, life: BEAM_SECONDS });
          burst(event.x2, ROCK_Y, event.y2, 4, beamMaterial.color, 2.4, 0.09);
          break;
        default:
          break;
      }
    }
    return lost;
  }

  /** Clears everything that belongs to the previous level. @param {LevelState} state */
  function reset(state) {
    for (const view of [...moduleViews.values()]) removeModuleView(view);
    for (const piece of debris) piece.object.removeFromParent();
    debris.length = 0;
    beams.length = 0;
    sparks.life.fill(0);
    landFlash.clear();
    rockFlash.clear();
    shake = 0;
    buildLand(state);
    landVersion = -1;
    moduleVersion = -1;
    markersDirty = true;
    current = state;
  }

  applyColors();

  return {
    /** CSS px per world unit, for tests and debugging. */
    get zoom() {
      return zoom;
    },
    get pixelRatio() {
      return dpr;
    },
    /**
     * @param {number} w CSS px
     * @param {number} h CSS px
     * @param {number} ratio device pixel ratio
     * @param {Insets} [free] space the HUD covers on each side, so the island is centred in what is left
     */
    resize(w, h, ratio, free) {
      width = Math.max(1, Math.floor(w));
      height = Math.max(1, Math.floor(h));
      deviceRatio = ratio;
      if (free) insets = free;
      applySize();
    },
    /** @param {HexfallColors} next */
    setColors(next) {
      colors = next;
      applyColors();
    },
    /** @param {boolean} value */
    setReducedMotion(value) {
      reducedMotion = value;
    },
    /** The module type the player is about to place, or null. Shows where it can go. @param {ModuleType | null} type */
    setBuildType(type) {
      if (type !== buildType) markersDirty = true;
      buildType = type;
    },
    /** Hex under the pointer while building. @param {Cursor | null} next */
    setCursor(next) {
      cursor = next;
    },
    /** The selected module's hex and its reach in hex steps. @param {{ q: number, r: number, range: number } | null} next */
    setSelection(next) {
      selection = next;
    },
    /**
     * The hex under a point of the canvas: a ray from the camera to the ground plane, then hex rounding.
     * @param {number} x CSS px from the canvas left
     * @param {number} y CSS px from the canvas top
     */
    pick(x, y) {
      ndc.set((x / width) * 2 - 1, -(y / height) * 2 + 1, -1).unproject(camera);
      camera.getWorldDirection(direction);
      if (Math.abs(direction.y) < 1e-6) return null;
      const t = -ndc.y / direction.y;
      return worldToHex(ndc.x + direction.x * t, ndc.z + direction.z * t);
    },
    /** Where a hex centre lands on the canvas, in CSS px. @param {number} q @param {number} r */
    hexToCanvas(q, r) {
      const world = hexToWorld(q, r);
      // Uses the unshaken camera so the answer does not wobble.
      const saved = camera.position.clone();
      camera.position.copy(cameraBase);
      camera.updateMatrixWorld(true);
      ndc.set(world.x, 0, world.y).project(camera);
      camera.position.copy(saved);
      camera.updateMatrixWorld(true);
      return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height };
    },
    /**
     * Draws one frame.
     * @param {LevelState} state
     * @param {number} dt seconds since the previous frame, already clamped
     * @param {number} ahead simulated seconds the fixed step has not consumed yet, used to smooth motion
     */
    render(state, dt, ahead) {
      if (state !== current) reset(state);
      adaptQuality(dt);
      clock += dt;
      const motion = reducedMotion ? 0 : 1;

      const lost = readEvents(state);
      if (state.landVersion !== landVersion) {
        landVersion = state.landVersion;
        syncLand(state);
        markersDirty = true;
      }
      if (state.moduleVersion !== moduleVersion) {
        moduleVersion = state.moduleVersion;
        syncModules(state, lost);
      }
      paintLand(state, dt);
      animateModules(dt, motion);
      if (markersDirty) syncMarkers(state);
      syncCursor();

      for (const [id, left] of rockFlash) {
        if (left - dt <= 0) rockFlash.delete(id);
        else rockFlash.set(id, left - dt);
      }
      drawRocks(state, ahead);
      drawShots(state, ahead);
      updateBeams(dt);
      updateSparks(dt);
      updateDebris(dt);

      shake = reducedMotion ? 0 : shake * Math.exp(-dt * 9);
      camera.position.copy(cameraBase);
      if (shake > 0.002) {
        camera.position.addScaledVector(cameraRight, (Math.random() - 0.5) * shake).addScaledVector(cameraUp, (Math.random() - 0.5) * shake);
      }
      if (motion) for (const [i, layer] of stars.entries()) layer.points.rotation.z = clock * (i === 0 ? 0.003 : 0.0045);

      renderer.render(scene, camera);
    },
    dispose() {
      for (const view of [...moduleViews.values()]) removeModuleView(view);
      for (const piece of debris) piece.object.removeFromParent();
      debris.length = 0;
      for (const item of owned) item.dispose();
      owned.length = 0;
      landMesh = null;
      current = null;
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
