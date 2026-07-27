import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const TAU = Math.PI * 2;

const DARK_PALETTE = {
  wall: '#1a1c1a',
  fabric: '#24231f',
  architecture: '#151715',
  ceiling: '#070807',
  floor: '#171611',
  floor_tile_a: '#191914',
  floor_tile_b: '#11130f',
  floor_alt: '#201e18',
  stone: '#111311',
  shadow: '#050606',
  bronze: '#6a4e2c',
  frame: '#5c4327',
  bench: '#17140f',
  wood: '#24160d',
  leather: '#19130e',
  leather_seam: '#090806',
  plaque: '#b5aa97',
  plaque_text: '#2c241a',
  planter: '#151715',
  botanical: '#29452a',
  botanical_leaf: '#294d2b',
  botanical_stem: '#283821',
  water: '#405451',
  water_highlight: '#91a7a2',
  ceramic: '#181a18',
  glass: '#675237',
  vessel: '#27231d'
};

const LIGHT_PALETTE = {
  wall: '#c1b8aa',
  fabric: '#aaa195',
  architecture: '#989086',
  ceiling: '#36332e',
  floor: '#7d7569',
  floor_tile_a: '#a2998b',
  floor_tile_b: '#8c8376',
  floor_alt: '#998f80',
  stone: '#91897e',
  shadow: '#504b43',
  bronze: '#9c7641',
  frame: '#806038',
  bench: '#7d7263',
  wood: '#6c4b31',
  leather: '#75675a',
  leather_seam: '#403931',
  plaque: '#ded5c6',
  plaque_text: '#3b3023',
  planter: '#4d4b46',
  botanical: '#52684a',
  botanical_leaf: '#607a55',
  botanical_stem: '#4d5d43',
  water: '#879995',
  water_highlight: '#c4d0cd',
  ceramic: '#77736b',
  glass: '#a68c66',
  vessel: '#5f584e'
};

const hasWebGL2 = () => {
  if (!window.WebGL2RenderingContext) return false;
  const probe = document.createElement('canvas');
  const context = probe.getContext('webgl2', {
    antialias: false,
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'high-performance'
  });
  if (!context) return false;
  context.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
};

const call = (callback, payload) => {
  if (typeof callback !== 'function') return;
  try {
    callback(payload);
  } catch (error) {
    window.setTimeout(() => console.error(error), 0);
  }
};

const disposeObject = (root) => {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
};

const readRole = (object, material) => {
  let cursor = object;
  while (cursor) {
    if (cursor.userData?.theme_role) return String(cursor.userData.theme_role).toLowerCase();
    cursor = cursor.parent;
  }
  if (material?.userData?.theme_role) return String(material.userData.theme_role).toLowerCase();
  const name = `${object?.name || ''} ${material?.name || ''}`.toLowerCase();
  if (/artwork|surface|wartrobe/.test(name)) return 'artwork';
  if (/floor/.test(name)) return 'floor';
  if (/ceiling/.test(name)) return 'ceiling';
  if (/bronze|frame|trim/.test(name)) return 'bronze';
  if (/shadow|recess/.test(name)) return 'shadow';
  if (/leaf|stem|botanical/.test(name)) return 'botanical';
  if (/vessel/.test(name)) return 'vessel';
  if (/wall/.test(name)) return 'wall';
  return 'architecture';
};

const findMetadataOwner = (object) => {
  let cursor = object;
  while (cursor) {
    if (cursor.userData?.asset_id
      || cursor.userData?.artwork_id
      || cursor.userData?.representation
      || cursor.userData?.site_panel_id
      || cursor.userData?.site_navigation) return cursor;
    cursor = cursor.parent;
  }
  return null;
};

const createGalleryEnvironment = (renderer) => {
  const environmentScene = new THREE.Scene();
  environmentScene.background = new THREE.Color('#080806');
  const geometry = new THREE.PlaneGeometry(1, 1);
  const cards = [
    [[-3.8, 3.2, -1.0], [4.6, 2.2], [0, Math.PI / 2, 0], [5.8, 3.8, 1.9]],
    [[3.8, 2.8, 0.8], [3.6, 2.0], [0, -Math.PI / 2, 0], [2.1, 3.1, 4.8]],
    [[0, 4.5, -3.2], [5.8, 2.2], [Math.PI / 2, 0, 0], [4.8, 3.7, 2.2]],
    [[0, 1.2, 4.4], [4.8, 2.0], [-Math.PI / 2, 0, 0], [1.0, 1.1, 1.4]]
  ];
  cards.forEach(([position, scale, rotation, colour]) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(...colour),
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const card = new THREE.Mesh(geometry, material);
    card.position.set(...position);
    card.scale.set(...scale, 1);
    card.rotation.set(...rotation);
    environmentScene.add(card);
  });
  const generator = new THREE.PMREMGenerator(renderer);
  generator.compileCubemapShader();
  const target = generator.fromScene(environmentScene, 0.06, 0.1, 30);
  generator.dispose();
  environmentScene.traverse((object) => object.material?.dispose?.());
  geometry.dispose();
  return target.texture;
};

const wrapCanvasText = (context, text, x, y, maxWidth, lineHeight, maxLines = 4) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return y + Math.min(lines.length, maxLines) * lineHeight;
};

const createLabelTexture = (data, lightTheme, sitePanel = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = sitePanel ? 1200 : 1000;
  canvas.height = sitePanel ? 760 : 700;
  const context = canvas.getContext('2d');
  const paper = lightTheme ? '#e9e2d7' : '#171612';
  const ink = lightTheme ? '#171611' : '#eee7dc';
  const gold = lightTheme ? '#80602f' : '#bd965b';
  context.fillStyle = paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, lightTheme ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.055)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, lightTheme ? 'rgba(72,48,25,.08)' : 'rgba(118,82,36,.10)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = gold;
  context.font = `700 ${sitePanel ? 29 : 25}px Manrope, sans-serif`;
  context.letterSpacing = '4px';
  context.fillText(String(data.kicker || data.year || 'DANNY HIRSCH ARTS').toUpperCase(), 64, 78);
  context.letterSpacing = '0px';
  context.fillStyle = ink;
  context.font = `400 ${sitePanel ? 72 : 62}px "Instrument Serif", Georgia, serif`;
  let cursorY = wrapCanvasText(context, data.title || 'Untitled', 64, 164, canvas.width - 128, sitePanel ? 76 : 66, 2) + 20;
  context.fillStyle = lightTheme ? '#4c4840' : '#bdb5aa';
  context.font = `500 ${sitePanel ? 28 : 24}px Manrope, sans-serif`;
  cursorY = wrapCanvasText(context, data.body || data.description || '', 64, cursorY, canvas.width - 128, sitePanel ? 40 : 34, sitePanel ? 4 : 3) + 26;
  context.strokeStyle = 'rgba(91,69,39,.34)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(64, cursorY);
  context.lineTo(canvas.width - 64, cursorY);
  context.stroke();
  if (!sitePanel) {
    const facts = [
      ['YEAR', data.year], ['MATERIAL', data.medium],
      ['DIMENSIONS', data.dimensions], ['AVAILABILITY', data.availability]
    ];
    facts.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 64 + column * (canvas.width - 128) / 2;
      const y = cursorY + 54 + row * 92;
      context.fillStyle = gold;
      context.font = '700 17px Manrope, sans-serif';
      context.fillText(label, x, y);
      context.fillStyle = ink;
      context.font = '500 21px Manrope, sans-serif';
      wrapCanvasText(context, value || '—', x, y + 30, (canvas.width - 160) / 2, 27, 2);
    });
  } else {
    context.fillStyle = gold;
    context.font = '700 21px Manrope, sans-serif';
    context.fillText('APPROACH · FOCUS · OPEN', 64, canvas.height - 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const NAVIGATION_TITLE_SHARE = 0.18;

const createNavigationTexture = (items, lightTheme, activeId) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2000;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  const paper = lightTheme ? '#e9e2d7' : '#c8bca8';
  const ink = lightTheme ? '#171611' : '#201b15';
  const gold = lightTheme ? '#8a6631' : '#725127';
  context.fillStyle = paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const titleWidth = canvas.width * NAVIGATION_TITLE_SHARE;
  const itemWidth = (canvas.width - titleWidth) / Math.max(1, items.length);
  context.textBaseline = 'middle';
  context.fillStyle = gold;
  context.font = '700 22px Manrope, sans-serif';
  context.letterSpacing = '3px';
  context.fillText('ROOM DIRECTORY', 30, canvas.height / 2 + 1);
  context.letterSpacing = '0px';
  items.forEach((item, index) => {
    const x = titleWidth + index * itemWidth;
    const activeItem = item.id === activeId;
    context.fillStyle = activeItem ? gold : 'rgba(91,69,39,.24)';
    context.fillRect(x, 0, 2, canvas.height);
    if (activeItem) context.fillRect(x + 2, 0, itemWidth - 2, canvas.height);
    context.fillStyle = activeItem ? '#f5efe5' : ink;
    context.font = '700 27px Manrope, sans-serif';
    context.textAlign = 'center';
    context.fillText(String(item.label || item.id).toUpperCase(), x + itemWidth / 2, canvas.height / 2 + 1);
  });
  context.textAlign = 'start';
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const createMicroNormalTexture = (kind = 'stone') => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const grain = Math.sin(x * (kind === 'wood' ? 0.22 : 0.67) + Math.sin(y * 0.11) * 1.8);
      const pore = Math.sin((x * 12.9898 + y * 78.233) % Math.PI) * 0.32;
      heights[y * size + x] = grain * (kind === 'wood' ? 0.7 : 0.22) + pore;
    }
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const left = heights[y * size + (x + size - 1) % size];
      const right = heights[y * size + (x + 1) % size];
      const down = heights[((y + size - 1) % size) * size + x];
      const up = heights[((y + 1) % size) * size + x];
      const offset = (y * size + x) * 4;
      image.data[offset] = 128 + clamp((left - right) * 42, -90, 90);
      image.data[offset + 1] = 128 + clamp((down - up) * 42, -90, 90);
      image.data[offset + 2] = 245;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'wood' ? 2 : 7, kind === 'wood' ? 5 : 7);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
};

const createWaterFlowTexture = () => {
  const width = 96;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const wave = Math.sin(x * 0.31 + y * 0.055) * 0.52
        + Math.sin(x * 0.09 - y * 0.12) * 0.27
        + Math.sin(y * 0.34 + x * 0.025) * 0.18;
      const offset = (y * width + x) * 4;
      image.data[offset] = 128 + wave * 42;
      image.data[offset + 1] = 128 + Math.sin(y * 0.16 + x * 0.08) * 34;
      image.data[offset + 2] = 238;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 3.8);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Fullscreen, user-entered 360 gallery. The canvas is decorative to assistive
 * technology; every movement and artwork action has an equivalent DOM control.
 */
export function initWalkableGallery3D(options = {}) {
  const mount = options.mount instanceof Element ? options.mount : document.querySelector(options.mount);
  const root = options.root instanceof Element ? options.root : mount?.closest('[data-room-experience]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  const inertController = (reason) => {
    call(options.onSkip, { reason });
    return {
      destroy() {},
      goToNextView() {},
      goToPreviousView() {},
      goToDemoRoom() {},
      goToSiteDirectory() {},
      goToSitePanel() {},
      requestMotionControl: async () => ({ supported: false, granted: false, reason }),
      resetView() {},
      setActive() {},
      setDemoMode() {},
      setTheme() {}
    };
  };

  if (!mount || !root) return inertController('missing-stage');
  if (reducedMotion.matches) return inertController('reduced-motion');
  if (connection?.saveData) return inertController('save-data');
  if (!hasWebGL2()) return inertController('webgl2-unavailable');

  // CSS width alone stops identifying a phone as soon as it rotates. Keep the
  // touch controller, conservative render budget, motion look and haptics on
  // coarse-pointer phones in landscape without classifying mouse tablets as
  // compact devices.
  const compact = window.matchMedia(
    '(max-width: 760px), (max-height: 560px) and (pointer: coarse)'
  ).matches;
  const lowPower = document.documentElement.classList.contains('low-power')
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const renderer = new THREE.WebGLRenderer({
    antialias: !lowPower,
    alpha: false,
    powerPreference: 'high-performance',
    // The canvas is redrawn on activation, resize and interaction; retaining
    // every frame would waste mobile GPU bandwidth.
    preserveDrawingBuffer: false
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : lowPower ? 1 : 1.5));
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.tabIndex = -1;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  const environmentTexture = createGalleryEnvironment(renderer);
  scene.environment = environmentTexture;
  const baseCameraFov = compact ? 68 : 62;
  const minimumCameraFov = compact ? 46 : 38;
  const maximumCameraFov = compact ? 82 : 78;
  const camera = new THREE.PerspectiveCamera(baseCameraFov, 1, 0.04, 120);
  camera.rotation.order = 'YXZ';
  const lookProbe = new THREE.PerspectiveCamera();
  lookProbe.rotation.order = 'YXZ';
  const ambient = new THREE.AmbientLight(0xfff4df, 0.1);
  const hemisphere = new THREE.HemisphereLight(0xffe6ba, 0x111310, 0.38);
  scene.add(ambient, hemisphere);

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  raycaster.far = 18;
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const pointer = { id: null, x: 0, y: 0, startX: 0, startY: 0, dragged: false };
  const held = new Set();
  const keys = new Set();
  const colliders = [];
  const artworkMeshes = [];
  const sitePanelMeshes = [];
  const siteNavigationMeshes = [];
  const focusRayMeshes = [];
  const demoObjects = [];
  const standardObjects = [];
  const labelEntries = [];
  const themedMaterials = [];
  const importedLights = [];
  const views = [];
  const listeners = [];
  const playerRadius = 0.34;
  const detailTextures = {
    stone: createMicroNormalTexture('stone'),
    wood: createMicroNormalTexture('wood'),
    leather: createMicroNormalTexture('leather'),
    water: createWaterFlowTexture()
  };
  const analogMove = { x: 0, y: 0 };
  const analogLook = { x: 0, y: 0 };
  const artCard = root.querySelector('[data-gallery-art-card]');
  const artProximity = root.querySelector('[data-gallery-art-proximity]');
  const zoomStatus = root.querySelector('[data-gallery-zoom]');
  const sidebar = root.querySelector('[data-gallery-demo-nav]');
  const sidebarToggle = root.querySelector('[data-gallery-sidebar-toggle]');
  const sidebarScroll = root.querySelector('.room-experience__sidebar-scroll');
  const waterMaterials = new Set();
  const motion = {
    supported: compact && typeof window.DeviceOrientationEvent !== 'undefined',
    enabled: false,
    listening: false,
    baseAlpha: null,
    baseBeta: null,
    baseGamma: null,
    baseYaw: 0,
    basePitch: 0,
    targetYaw: 0,
    targetPitch: 0
  };

  let destroyed = false;
  let active = false;
  let ready = false;
  let frameRequest = 0;
  let model = null;
  let animationMixer = null;
  let animationClipCount = 0;
  let currentTheme = options.theme === 'light' ? 'light' : 'dark';
  let yaw = 0;
  let pitch = 0;
  let targetCameraFov = baseCameraFov;
  let cameraRail = null;
  let cameraRailTimer = 0;
  let bounds = { minX: -6.8, maxX: 6.8, minZ: -3.2, maxZ: 6.4 };
  let startPosition = new THREE.Vector3(0, 1.68, 4.8);
  let startTarget = new THREE.Vector3(0, 2.4, -2.8);
  let currentViewIndex = -1;
  let focusedArtwork = null;
  let focusedSitePanel = null;
  let activeNavigationId = 'artworks';
  let demoMode = false;
  let lastFocusCheck = 0;
  let themeTransition = 1;
  let lastHapticAt = 0;
  let focusCandidateKey = null;
  let focusCandidateSince = 0;
  let sidebarCollapsed = compact;

  const triggerHaptic = (duration = 8) => {
    if (!compact || typeof navigator.vibrate !== 'function') return;
    const now = performance.now();
    if (now - lastHapticAt < 360) return;
    lastHapticAt = now;
    navigator.vibrate(duration);
  };

  const resetMotionBaseline = () => {
    motion.baseAlpha = null;
    motion.baseBeta = null;
    motion.baseGamma = null;
    motion.baseYaw = yaw;
    motion.basePitch = pitch;
    motion.targetYaw = yaw;
    motion.targetPitch = pitch;
  };

  const shortestAngle = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

  const onDeviceOrientation = (event) => {
    if (!active || !motion.enabled || event.beta == null || event.gamma == null) return;
    const alpha = Number(event.alpha || 0);
    const beta = Number(event.beta);
    const gamma = Number(event.gamma);
    if (motion.baseBeta == null) {
      motion.baseAlpha = alpha;
      motion.baseBeta = beta;
      motion.baseGamma = gamma;
      motion.baseYaw = yaw;
      motion.basePitch = pitch;
      return;
    }
    const screenAngle = Number(window.screen?.orientation?.angle || window.orientation || 0);
    const landscape = Math.abs(screenAngle) === 90;
    const horizontalDelta = THREE.MathUtils.degToRad(
      landscape ? beta - motion.baseBeta : gamma - motion.baseGamma
    );
    const verticalDelta = THREE.MathUtils.degToRad(
      landscape ? gamma - motion.baseGamma : beta - motion.baseBeta
    );
    const landscapeDirection = screenAngle === -90 || screenAngle === 270 ? -1 : 1;
    motion.targetYaw = motion.baseYaw - clamp(horizontalDelta * (landscape ? landscapeDirection : 1), -0.92, 0.92);
    motion.targetPitch = clamp(motion.basePitch - clamp(verticalDelta, -0.68, 0.68), -1.05, 1.05);
    ensureFrame();
  };

  const attachMotion = () => {
    if (!motion.enabled || motion.listening || !active) return;
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
    motion.listening = true;
    resetMotionBaseline();
  };

  const detachMotion = () => {
    if (!motion.listening) return;
    window.removeEventListener('deviceorientation', onDeviceOrientation, true);
    motion.listening = false;
  };

  const requestMotionControl = async () => {
    if (!motion.supported || !window.isSecureContext) {
      const result = { supported: motion.supported, granted: false, reason: window.isSecureContext ? 'unsupported' : 'secure-context-required' };
      call(options.onMotionState, result);
      return result;
    }
    try {
      let permission = 'granted';
      if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        permission = await window.DeviceOrientationEvent.requestPermission();
      }
      motion.enabled = permission === 'granted';
      if (motion.enabled) attachMotion();
      const result = { supported: true, granted: motion.enabled, reason: motion.enabled ? 'enabled' : 'denied' };
      call(options.onMotionState, result);
      return result;
    } catch (error) {
      const result = { supported: true, granted: false, reason: 'permission-error' };
      call(options.onMotionState, result);
      return result;
    }
  };

  const refreshLabelMaterials = () => {
    const lightTheme = currentTheme === 'light';
    labelEntries.forEach((entry) => {
      entry.material?.map?.dispose?.();
      entry.material?.dispose?.();
      const userData = entry.object.userData || {};
      const sitePanel = Boolean(userData.site_panel_id);
      const navigation = Boolean(userData.site_navigation);
      const data = sitePanel ? {
        title: userData.site_title,
        kicker: userData.site_kicker,
        body: userData.site_body
      } : {
        title: userData.title,
        year: userData.year,
        medium: userData.medium,
        dimensions: userData.dimensions,
        availability: userData.availability,
        description: userData.description
      };
      let navigationItems = [];
      if (navigation) {
        try {
          navigationItems = JSON.parse(userData.site_navigation_items_json || '[]');
        } catch (error) {
          navigationItems = [];
        }
      }
      const labelMap = navigation
        ? createNavigationTexture(navigationItems, lightTheme, activeNavigationId)
        : createLabelTexture(data, lightTheme, sitePanel);
      // Museum text must remain readable under every virtual spotlight. In the
      // bright room, use an unlit print surface so exposure cannot bleach its
      // ink; the dark room keeps a restrained physical paper response.
      entry.material = lightTheme
        ? new THREE.MeshBasicMaterial({
          color: '#ffffff',
          map: labelMap,
          side: THREE.DoubleSide,
          toneMapped: false
        })
        : new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          map: labelMap,
          roughness: 0.42,
          metalness: 0.02,
          clearcoat: 0.16,
          clearcoatRoughness: 0.28,
          envMapIntensity: 0.42,
          side: THREE.DoubleSide
        });
      entry.object.material = entry.material;
      entry.object.visible = (sitePanel || navigation) ? demoMode : true;
    });
  };

  const listen = (target, type, handler, settings) => {
    target.addEventListener(type, handler, settings);
    listeners.push(() => target.removeEventListener(type, handler, settings));
  };

  const setSidebarCollapsed = (collapsed) => {
    sidebarCollapsed = compact ? Boolean(collapsed) : false;
    sidebar?.classList.toggle('is-collapsed', sidebarCollapsed);
    root.classList.toggle('is-sidebar-collapsed', sidebarCollapsed);
    sidebarToggle?.setAttribute('aria-expanded', String(!sidebarCollapsed));
    if (sidebarScroll) sidebarScroll.hidden = sidebarCollapsed;
  };

  setSidebarCollapsed(sidebarCollapsed);

  const resolveBounds = (minimum, maximum) => {
    if (!minimum || !maximum) return;
    const first = minimum.getWorldPosition(new THREE.Vector3());
    const second = maximum.getWorldPosition(new THREE.Vector3());
    bounds = {
      minX: Math.min(first.x, second.x),
      maxX: Math.max(first.x, second.x),
      minZ: Math.min(first.z, second.z),
      maxZ: Math.max(first.z, second.z)
    };
  };

  const collides = (x, z) => colliders.some((box) => {
    if (box.demoOnly && !demoMode) return false;
    if (box.hiddenInDemo && demoMode) return false;
    return x + playerRadius > box.minX
      && x - playerRadius < box.maxX
      && z + playerRadius > box.minZ
      && z - playerRadius < box.maxZ;
  });

  const movePlayer = (x, z) => {
    const nextX = clamp(x, bounds.minX + playerRadius, bounds.maxX - playerRadius);
    const nextZ = clamp(z, bounds.minZ + playerRadius, bounds.maxZ - playerRadius);
    const xBlocked = nextX !== x || collides(nextX, camera.position.z);
    const zBlocked = nextZ !== z || collides(camera.position.x, nextZ);
    if (!xBlocked) camera.position.x = nextX;
    if (!zBlocked) camera.position.z = nextZ;
    if (xBlocked || zBlocked) triggerHaptic(9);
    return { xBlocked, zBlocked };
  };

  const orientToward = (target) => {
    camera.lookAt(target);
    lookEuler.setFromQuaternion(camera.quaternion, 'YXZ');
    pitch = clamp(lookEuler.x, -1.05, 1.05);
    yaw = lookEuler.y;
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  };

  const updateZoomStatus = () => {
    if (!zoomStatus) return;
    const percentage = Math.round((baseCameraFov / targetCameraFov) * 100);
    zoomStatus.value = `${percentage}%`;
    zoomStatus.textContent = `${percentage}%`;
    zoomStatus.setAttribute('aria-label', `Gallery zoom level ${percentage} percent`);
  };

  const setCameraFov = (fieldOfView, instant = true) => {
    targetCameraFov = clamp(fieldOfView, minimumCameraFov, maximumCameraFov);
    updateZoomStatus();
    if (!instant && !reducedMotion.matches) return;
    if (Math.abs(camera.fov - targetCameraFov) < 0.01) return;
    camera.fov = targetCameraFov;
    camera.updateProjectionMatrix();
  };

  const clearCameraRailTimer = () => {
    if (!cameraRailTimer) return;
    window.clearTimeout(cameraRailTimer);
    cameraRailTimer = 0;
  };

  const cancelCameraRail = ({ preserveZoom = true } = {}) => {
    if (!cameraRail) return;
    clearCameraRailTimer();
    cameraRail = null;
    if (preserveZoom) {
      targetCameraFov = camera.fov;
      updateZoomStatus();
    }
  };

  const anglesToward = (position, target) => {
    // Cameras look down their local -Z axis. A generic Object3D looks along
    // +Z, which would turn a curated viewpoint away from its artwork.
    lookProbe.position.copy(position);
    lookProbe.up.copy(camera.up);
    lookProbe.lookAt(target);
    lookEuler.setFromQuaternion(lookProbe.quaternion, 'YXZ');
    return {
      pitch: clamp(lookEuler.x, -1.05, 1.05),
      yaw: lookEuler.y
    };
  };

  const moveCameraTo = (position, target, fieldOfView, instant = false) => {
    const destinationAngles = anglesToward(position, target);
    const shouldSnap = instant || !ready || reducedMotion.matches || !active;
    targetCameraFov = clamp(fieldOfView, minimumCameraFov, maximumCameraFov);
    updateZoomStatus();
    focusCandidateKey = null;
    focusCandidateSince = performance.now();
    if (shouldSnap) {
      clearCameraRailTimer();
      cameraRail = null;
      camera.position.copy(position);
      yaw = destinationAngles.yaw;
      pitch = destinationAngles.pitch;
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      setCameraFov(targetCameraFov, true);
      return;
    }
    cameraRail = {
      startedAt: performance.now(),
      duration: 650,
      fromPosition: camera.position.clone(),
      toPosition: position.clone(),
      fromYaw: yaw,
      yawDelta: shortestAngle(yaw, destinationAngles.yaw),
      fromPitch: pitch,
      toPitch: destinationAngles.pitch,
      fromFov: camera.fov,
      toFov: targetCameraFov
    };
    const pendingRail = cameraRail;
    clearCameraRailTimer();
    // requestAnimationFrame can be suspended while a browser tab is being
    // restored or captured. A timer guarantees the curated destination still
    // settles, instead of leaving the visitor between two rooms indefinitely.
    cameraRailTimer = window.setTimeout(() => {
      cameraRailTimer = 0;
      if (destroyed || cameraRail !== pendingRail) return;
      camera.position.copy(pendingRail.toPosition);
      yaw = pendingRail.fromYaw + pendingRail.yawDelta;
      pitch = pendingRail.toPitch;
      camera.fov = pendingRail.toFov;
      cameraRail = null;
      camera.rotation.set(pitch, yaw, 0, 'YXZ');
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      updateArtworkFocus({ immediate: true });
      if (active) renderer.render(scene, camera);
    }, cameraRail.duration + 34);
    ensureFrame();
  };

  const resetView = () => {
    currentViewIndex = -1;
    moveCameraTo(startPosition, startTarget, baseCameraFov, !ready);
    call(options.onViewChange, { index: -1, label: 'Gallery entrance' });
    if (ready && !cameraRail) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
  };

  const goToView = (index) => {
    if (!views.length) return resetView();
    currentViewIndex = (index + views.length) % views.length;
    const view = views[currentViewIndex];
    const viewFov = view.object.userData?.view_kind === 'site_navigation'
      ? (compact ? 82 : 66)
      : baseCameraFov;
    view.object.getWorldPosition(worldPosition);
    const target = view.target
      ? view.target.getWorldPosition(new THREE.Vector3())
      : startTarget;
    moveCameraTo(worldPosition, target, viewFov);
    call(options.onViewChange, {
      index: currentViewIndex,
      label: view.label,
      total: views.length
    });
    if (ready && !cameraRail) {
      camera.updateMatrixWorld(true);
      // A reduced-motion jump has no rail frames in which to establish the
      // dwell candidate. Resolve its centred work immediately so the dossier
      // is never delayed or left stale after an accessible view change.
      updateArtworkFocus({ immediate: reducedMotion.matches });
      renderer.render(scene, camera);
    }
  };

  const setNavigationId = (id) => {
    activeNavigationId = id;
    if (compact && id !== 'directory') setSidebarCollapsed(true);
    call(options.onNavigationChange, { id });
    if (demoMode) refreshLabelMaterials();
  };

  const goToWork = (direction) => {
    const workIndices = views
      .map((view, index) => ({ index, label: view.label }))
      .filter(({ index, label }) => !views[index].object.userData?.demo_only && !/entrance|overview/i.test(label))
      .map(({ index }) => index);
    if (!workIndices.length) return resetView();
    const currentWork = workIndices.indexOf(currentViewIndex);
    const nextWork = currentWork < 0
      ? (direction > 0 ? 0 : workIndices.length - 1)
      : (currentWork + direction + workIndices.length) % workIndices.length;
    setNavigationId('artworks');
    goToView(workIndices[nextWork]);
  };

  const applyThemeTargets = (instant = false) => {
    const isLight = currentTheme === 'light';
    const palette = isLight ? LIGHT_PALETTE : DARK_PALETTE;
    themedMaterials.forEach((entry) => {
      let color = palette[entry.role] || palette.architecture;
      if (entry.hasGeneratedMap) {
        if (entry.role === 'wood') color = isLight ? '#e0c9b2' : '#b69b83';
        else if (/leather/.test(entry.role)) color = isLight ? '#d4c4b6' : '#a58f7e';
        else color = isLight ? '#ddd7cd' : '#aaa69d';
      }
      entry.target.set(color);
      if (instant && entry.material.color) entry.material.color.copy(entry.target);
    });
    scene.background = new THREE.Color(isLight ? '#746c61' : '#060706');
    if ('environmentIntensity' in scene) scene.environmentIntensity = isLight ? 0.78 : 0.68;
    scene.fog = new THREE.FogExp2(isLight ? '#756d62' : '#070807', isLight ? 0.013 : 0.022);
    renderer.toneMappingExposure = isLight ? 0.84 : 0.72;
    ambient.intensity = isLight ? 0.58 : 0.10;
    hemisphere.intensity = isLight ? 0.76 : 0.27;
    hemisphere.color.set(isLight ? '#fff4df' : '#ffdda7');
    hemisphere.groundColor.set(isLight ? '#6b655c' : '#0c0f0d');
    importedLights.forEach((entry) => {
      // Blender's physically based light export is expressed in candela and is
      // intentionally much stronger than Three's small web exhibition needs.
      // Scale the original rig as a unit so the light geometry and artwork keep
      // their authored relationship without clipping pigment to flat white.
      entry.targetIntensity = entry.intensity * (isLight ? 0.0068 : 0.0115);
      entry.light.intensity = entry.targetIntensity;
      if (entry.light.color) entry.light.color.copy(entry.color);
    });
    if (labelEntries.length) refreshLabelMaterials();
    themeTransition = instant ? 1 : 0;
  };

  const setTheme = (theme) => {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    const snap = !ready || document.hidden;
    applyThemeTargets(snap);
    if (ready && document.hidden) {
      camera.updateMatrixWorld(true);
      renderer.render(scene, camera);
    }
  };

  const isVisibleForFocus = (object) => {
    let cursor = object;
    while (cursor) {
      if (cursor.visible === false) return false;
      cursor = cursor.parent;
    }
    return true;
  };

  const setArtworkProximity = (owner, distance = Infinity) => {
    const isArtwork = Boolean(owner && !owner.userData?.site_panel_id && !owner.userData?.site_navigation);
    const state = !isArtwork
      ? 'ambient'
      : distance <= 1.85
        ? 'near'
        : distance <= 3.15
          ? 'focused'
          : 'distant';
    if (artCard?.dataset.proximity === state && root.dataset.artProximity === state) return;
    if (artCard) artCard.dataset.proximity = state;
    root.dataset.artProximity = state;
    if (artProximity) {
      artProximity.textContent = state === 'near'
        ? 'Within reach'
        : state === 'focused'
          ? 'Focused view'
          : state === 'distant'
            ? 'Approach the work'
            : 'Free look';
    }
    if (compact && demoMode && state !== 'ambient') setSidebarCollapsed(true);
  };

  const commitFocus = (owner, hit) => {
    if (owner?.userData?.site_panel_id) {
      const id = owner.userData.site_panel_id;
      if (id === focusedSitePanel?.id) return;
      focusedSitePanel = {
        id,
        title: owner.userData.site_title || 'Room information',
        kicker: owner.userData.site_kicker || 'Spatial exhibition',
        body: owner.userData.site_body || '',
        link: owner.userData.site_link || '',
        linkLabel: owner.userData.site_link_label || 'Open information'
      };
      focusedArtwork = null;
      setArtworkProximity(null);
      call(options.onArtworkFocus, null);
      call(options.onSitePanelFocus, focusedSitePanel);
      return;
    }
    if (focusedSitePanel) {
      focusedSitePanel = null;
      call(options.onSitePanelFocus, null);
    }
    const id = owner?.userData?.asset_id || owner?.userData?.artwork_id || null;
    const focusKey = owner
      ? owner.userData.asset_id || owner.userData.artwork_id || owner.uuid
      : null;
    setArtworkProximity(owner, hit?.distance);
    if (focusKey === focusedArtwork?.focusKey) return;
    focusedArtwork = owner ? {
      id,
      focusKey,
      title: owner.userData.title || owner.userData.display_label || owner.userData.label || owner.name.replaceAll('_', ' '),
      detail: owner.userData.detail_label || owner.userData.medium || owner.userData.representation || 'Genuine artwork photography',
      source: owner.userData.source_asset || owner.userData.delivery_asset || '',
      representation: owner.userData.representation || '',
      collectionTitle: owner.userData.collection_title || owner.userData.title || '',
      year: owner.userData.year || '',
      medium: owner.userData.medium || '',
      dimensions: owner.userData.dimensions || '',
      availability: owner.userData.availability || owner.userData.status || '',
      description: owner.userData.description || '',
      distance: hit?.distance || null
    } : null;
    call(options.onArtworkFocus, focusedArtwork);
  };

  const updateArtworkFocus = ({ immediate = false } = {}) => {
    if (!focusRayMeshes.length) return;
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hit = raycaster
      .intersectObjects(focusRayMeshes.filter(isVisibleForFocus), false)[0] || null;
    let owner = hit ? findMetadataOwner(hit.object) : null;
    const isSitePanel = Boolean(owner?.userData?.site_panel_id);
    const isArtwork = Boolean(owner && !isSitePanel && !owner.userData?.site_navigation);
    if ((isSitePanel && (!demoMode || hit.distance > 5.2)) || (isArtwork && hit.distance > 4.8)) owner = null;
    if (owner?.userData?.site_navigation) owner = null;

    const key = owner?.userData?.site_panel_id
      ? `panel:${owner.userData.site_panel_id}`
      : owner
        ? `art:${owner.userData.asset_id || owner.userData.artwork_id || owner.uuid}`
        : 'none';
    const committedKey = focusedSitePanel
      ? `panel:${focusedSitePanel.id}`
      : focusedArtwork
        ? `art:${focusedArtwork.focusKey || focusedArtwork.id || focusedArtwork.title}`
        : 'none';
    const now = performance.now();
    if (key === committedKey) {
      focusCandidateKey = key;
      focusCandidateSince = now;
      if (owner && !isSitePanel) setArtworkProximity(owner, hit?.distance);
      return;
    }
    if (key !== focusCandidateKey) {
      focusCandidateKey = key;
      focusCandidateSince = now;
      if (!immediate) return;
    }
    if (!immediate && now - focusCandidateSince < 650) return;
    commitFocus(owner, owner ? hit : null);
  };

  const setDemoMode = (nextDemoMode) => {
    demoMode = Boolean(nextDemoMode);
    if (compact) setSidebarCollapsed(true);
    demoObjects.forEach((object) => { object.visible = demoMode; });
    standardObjects.forEach((object) => { object.visible = !demoMode; });
    if (!demoMode) mount.classList.remove('has-interactive-target');
    if (!demoMode && focusedSitePanel) {
      focusedSitePanel = null;
      call(options.onSitePanelFocus, null);
    }
    call(options.onDemoModeChange, {
      active: demoMode,
      navigationEmbedded: siteNavigationMeshes.length > 0,
      panels: sitePanelMeshes.length
    });
    if (ready) {
      camera.updateMatrixWorld(true);
      focusCandidateKey = null;
      updateArtworkFocus({ immediate: true });
      renderer.render(scene, camera);
    }
  };

  const goToSitePanel = (panelId) => {
    const index = views.findIndex((view) => view.object.userData?.demo_only && (
      !panelId || view.target?.userData?.site_panel_id === panelId
    ));
    if (index < 0) return;
    if (!demoMode) setDemoMode(true);
    setNavigationId(panelId || 'about');
    goToView(index);
  };

  const goToSiteDirectory = () => {
    const index = views.findIndex((view) => view.object.userData?.view_kind === 'site_navigation'
      || /site directory/i.test(view.label));
    if (index < 0) return;
    if (!demoMode) setDemoMode(true);
    setNavigationId('directory');
    goToView(index);
  };

  const goToDemoRoom = (roomId = 'gallery-hall') => {
    const index = views.findIndex((view) => view.object.userData?.demo_room_id === roomId);
    if (index < 0) return;
    if (!demoMode) setDemoMode(true);
    setNavigationId(roomId);
    goToView(index);
  };

  const activateNavigationItem = (item) => {
    if (!item?.id) return;
    setNavigationId(item.id);
    call(options.onNavigationActivate, item);
    if (item.id === 'artworks') goToWork(1);
    else if (item.id.startsWith('room-')) goToDemoRoom(item.id.replace(/^room-/, ''));
    else goToSitePanel(item.id);
  };

  const navigationHitAt = (clientX, clientY) => {
    if (!demoMode || !siteNavigationMeshes.length) return null;
    const rect = mount.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    raycaster.setFromCamera({
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1
    }, camera);
    return raycaster.intersectObjects(siteNavigationMeshes, false)[0] || null;
  };

  const activateNavigationAt = (clientX, clientY) => {
    const hit = navigationHitAt(clientX, clientY);
    if (!hit?.uv) return false;
    let items = [];
    try {
      items = JSON.parse(hit.object.userData?.site_navigation_items_json || '[]');
    } catch (error) {
      items = [];
    }
    const position = clamp(hit.uv.x, 0, 0.999999);
    if (position < NAVIGATION_TITLE_SHARE || !items.length) {
      goToSiteDirectory();
      return true;
    }
    const index = Math.floor(((position - NAVIGATION_TITLE_SHARE) / (1 - NAVIGATION_TITLE_SHARE)) * items.length);
    activateNavigationItem(items[clamp(index, 0, items.length - 1)]);
    return true;
  };

  const updateCameraRail = () => {
    if (!cameraRail) return;
    const rail = cameraRail;
    const progress = clamp((performance.now() - rail.startedAt) / rail.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(rail.fromPosition, rail.toPosition, eased);
    yaw = rail.fromYaw + rail.yawDelta * eased;
    pitch = THREE.MathUtils.lerp(rail.fromPitch, rail.toPitch, eased);
    const nextFov = THREE.MathUtils.lerp(rail.fromFov, rail.toFov, eased);
    if (Math.abs(camera.fov - nextFov) > 0.005) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    if (progress >= 1) {
      clearCameraRailTimer();
      camera.position.copy(rail.toPosition);
      yaw = rail.fromYaw + rail.yawDelta;
      pitch = rail.toPitch;
      cameraRail = null;
      camera.fov = targetCameraFov;
      camera.updateProjectionMatrix();
    }
  };

  const updateZoom = (delta) => {
    if (cameraRail || Math.abs(camera.fov - targetCameraFov) < 0.015) return;
    const amount = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 11);
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetCameraFov, amount);
    if (Math.abs(camera.fov - targetCameraFov) < 0.02) camera.fov = targetCameraFov;
    camera.updateProjectionMatrix();
  };

  const updateMovement = (delta) => {
    const forwardInput = clamp((keys.has('KeyW') || keys.has('ArrowUp') || held.has('forward') ? 1 : 0)
      - (keys.has('KeyS') || keys.has('ArrowDown') || held.has('backward') ? 1 : 0)
      - analogMove.y, -1, 1);
    const sideInput = clamp((keys.has('KeyD') || held.has('right') ? 1 : 0)
      - (keys.has('KeyA') || held.has('left') ? 1 : 0)
      + analogMove.x, -1, 1);
    const turnInput = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    const hasUserInput = Boolean(forwardInput || sideInput || turnInput
      || Math.abs(analogLook.x) > 0.01 || Math.abs(analogLook.y) > 0.01);
    if (hasUserInput) cancelCameraRail();
    if (turnInput) yaw -= turnInput * delta * 1.32;
    if (Math.abs(analogLook.x) > 0.01 || Math.abs(analogLook.y) > 0.01) {
      yaw -= analogLook.x * delta * 1.75;
      pitch = clamp(pitch - analogLook.y * delta * 1.38, -1.05, 1.05);
    } else if (motion.enabled && motion.listening && !cameraRail) {
      const blend = 1 - Math.exp(-delta * 7.5);
      yaw += shortestAngle(yaw, motion.targetYaw) * blend;
      pitch += (motion.targetPitch - pitch) * blend;
    }
    if (!forwardInput && !sideInput) return;
    if (currentViewIndex !== -1) setCameraFov(baseCameraFov, false);
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(-forward.z, 0, forward.x);
    candidate.copy(camera.position)
      .addScaledVector(forward, forwardInput * delta * (compact ? 1.28 : 1.52))
      .addScaledVector(right, sideInput * delta * (compact ? 1.12 : 1.34));
    movePlayer(candidate.x, candidate.z);
    currentViewIndex = -1;
  };

  const nudgePlayer = (action, distance = compact ? 0.2 : 0.24) => {
    cancelCameraRail();
    if (currentViewIndex !== -1) setCameraFov(baseCameraFov, false);
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(-forward.z, 0, forward.x);
    candidate.copy(camera.position);
    if (action === 'forward') candidate.addScaledVector(forward, distance);
    if (action === 'backward') candidate.addScaledVector(forward, -distance);
    if (action === 'left') candidate.addScaledVector(right, -distance);
    if (action === 'right') candidate.addScaledVector(right, distance);
    movePlayer(candidate.x, candidate.z);
    currentViewIndex = -1;
    camera.updateMatrixWorld(true);
    updateArtworkFocus();
    renderer.render(scene, camera);
  };

  const updateTheme = (delta) => {
    if (themeTransition >= 1) return;
    const amount = 1 - Math.exp(-delta * 6);
    themedMaterials.forEach(({ material, target }) => material.color?.lerp(target, amount));
    themeTransition = Math.min(1, themeTransition + delta * 2.5);
  };

  const render = () => {
    frameRequest = 0;
    if (!active || destroyed || document.hidden || !ready) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    updateCameraRail();
    updateMovement(delta);
    updateZoom(delta);
    updateTheme(delta);
    // The water wall belongs to the room, not only to the spatial-site mode.
    // Keep its lightweight authored clips alive in both Classic Private Room
    // and the full Interactive Gallery.
    animationMixer?.update(delta);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    const elapsed = clock.elapsedTime;
    if (waterMaterials.size) {
      detailTextures.water.offset.y = (detailTextures.water.offset.y - delta * 0.22) % 1;
      detailTextures.water.offset.x = Math.sin(elapsed * 0.23) * 0.035;
      waterMaterials.forEach((material, index) => {
        material.roughness = clamp(0.10 + Math.sin(elapsed * 1.35 + index) * 0.025, 0.06, 0.16);
      });
    }
    importedLights.forEach((entry, index) => {
      entry.light.intensity = entry.targetIntensity * (1 + Math.sin(elapsed * 0.42 + index * 1.7) * 0.028);
    });
    if (elapsed - lastFocusCheck > 0.12) {
      updateArtworkFocus();
      lastFocusCheck = elapsed;
    }
    renderer.render(scene, camera);
    frameRequest = window.requestAnimationFrame(render);
  };

  const ensureFrame = () => {
    if (active && ready && !frameRequest && !destroyed) {
      clock.getDelta();
      frameRequest = window.requestAnimationFrame(render);
    }
  };

  const setActive = (nextActive) => {
    active = Boolean(nextActive);
    keys.clear();
    held.clear();
    analogMove.x = 0;
    analogMove.y = 0;
    analogLook.x = 0;
    analogLook.y = 0;
    root.querySelectorAll('[data-gallery-joystick]').forEach((zone) => {
      zone.classList.remove('is-engaged');
      zone.style.setProperty('--stick-x', '0px');
      zone.style.setProperty('--stick-y', '0px');
    });
    if (active) attachMotion();
    else {
      detachMotion();
      cancelCameraRail({ preserveZoom: false });
      setCameraFov(baseCameraFov, true);
      focusCandidateKey = null;
      focusCandidateSince = 0;
      commitFocus(null, null);
    }
    if (!active && frameRequest) {
      window.cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    }
    if (active && ready) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
    ensureFrame();
  };

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    ensureFrame();
  };

  const prepareModel = (gltf) => {
    model = gltf.scene;
    scene.add(model);
    if (gltf.animations?.length) {
      animationClipCount = gltf.animations.length;
      animationMixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        animationMixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
      });
    }
    model.updateMatrixWorld(true);
    const materialEntries = new Map();
    const colliderNodes = [];

    model.traverse((object) => {
      if (object.isCamera) object.visible = false;
      if (object.userData?.demo_only) {
        demoObjects.push(object);
        object.visible = demoMode;
      }
      if (object.userData?.demo_hidden) {
        standardObjects.push(object);
        object.visible = !demoMode;
      }
      if (object.isLight) {
        importedLights.push({
          light: object,
          intensity: object.intensity,
          targetIntensity: object.intensity,
          color: object.color.clone()
        });
        object.castShadow = renderer.shadowMap.enabled && importedLights.length === 1;
        if (object.shadow) {
          object.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024);
          object.shadow.bias = -0.0004;
        }
      }
      if (object.name.startsWith('COLLIDER_') || object.userData?.kind === 'aabb') colliderNodes.push(object);
      if (object.name.startsWith('VIEW_') || object.userData?.kind === 'view') {
        views.push({
          object,
          label: object.userData?.view_label || object.userData?.label || object.name.replace(/^VIEW_/, '').replaceAll('_', ' ')
        });
      }
      if (!object.isMesh) return;
      object.frustumCulled = true;
      object.receiveShadow = renderer.shadowMap.enabled;
      object.castShadow = renderer.shadowMap.enabled && /frame|bench|vessel|plant/i.test(object.name);
      const owner = findMetadataOwner(object);
      const focusMaterial = Array.isArray(object.material) ? object.material[0] : object.material;
      const focusRole = readRole(object, focusMaterial);
      if (!object.name.startsWith('COLLIDER_')
        && object.userData?.kind !== 'aabb'
        && object.userData?.kind !== 'view'
        && (owner || !/water|botanical|glass/.test(focusRole))) {
        focusRayMeshes.push(object);
      }
      if (object.userData?.catalogue_label || object.userData?.site_panel_id || object.userData?.site_navigation) {
        labelEntries.push({ object, material: null });
        if (object.userData?.site_navigation) {
          siteNavigationMeshes.push(object);
        } else if (object.userData?.site_panel_id) {
          object.visible = demoMode;
          sitePanelMeshes.push(object);
        } else {
          artworkMeshes.push(object);
        }
        return;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        const role = readRole(object, material);
        if (role === 'artwork' || owner) {
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          }
          material.color?.set('#ffffff');
          material.side = THREE.DoubleSide;
          material.toneMapped = true;
          material.envMapIntensity = 0.14;
          artworkMeshes.push(object);
        } else if (!materialEntries.has(material)) {
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          }
          const reflective = /floor_tile|floor_alt|bronze|plaque|planter|wood|leather/.test(role);
          material.envMapIntensity = reflective ? (/bronze|plaque_text/.test(role) ? 1.15 : 0.72) : 0.22;
          if ('clearcoat' in material) {
            material.clearcoat = Number(material.userData?.web_clearcoat ?? material.clearcoat ?? 0);
            material.clearcoatRoughness = Number(material.userData?.web_clearcoat_roughness ?? material.clearcoatRoughness ?? 0.2);
          }
          if (/floor_tile|floor_alt|stone|wall/.test(role)) {
            material.normalMap = detailTextures.stone;
            const normalStrength = role === 'wall'
              ? 0.045
              : (/floor_tile|floor_alt/.test(role) ? 0.085 : 0.10);
            material.normalScale?.set(normalStrength, normalStrength);
          } else if (role === 'wood') {
            material.normalMap = detailTextures.wood;
            material.normalScale?.set(0.28, 0.28);
          } else if (/leather/.test(role)) {
            material.normalMap = detailTextures.leather;
            material.normalScale?.set(0.20, 0.20);
          } else if (/water/.test(role)) {
            material.normalMap = detailTextures.water;
            material.normalScale?.set(role === 'water_highlight' ? 0.42 : 0.66, role === 'water_highlight' ? 0.82 : 1.1);
            material.envMapIntensity = 1.12;
            material.clearcoat = Math.max(0.84, material.clearcoat || 0);
            waterMaterials.add(material);
          }
          if (/botanical_leaf|botanical/.test(role)) {
            material.side = THREE.DoubleSide;
            material.envMapIntensity = 0.12;
            material.roughness = Math.max(0.48, material.roughness || 0);
          }
          material.needsUpdate = true;
          const target = new THREE.Color();
          const hasGeneratedMap = Boolean(material.map) && (
            Boolean(material.userData?.generated_architectural_texture)
            || /marble|mineral_fabric|stained_oak|walnut|saddle_leather/i.test(material.name)
          );
          materialEntries.set(material, { material, role, target, hasGeneratedMap });
        }
      });
    });

    themedMaterials.push(...materialEntries.values());
    model.updateMatrixWorld(true);

    colliderNodes.forEach((object) => {
      object.getWorldPosition(worldPosition);
      const half = object.userData?.half_extents_gltf_xyz
        || object.userData?.half_extents
        || object.userData?.halfExtents;
      if (Array.isArray(half) && half.length >= 3) {
        colliders.push({
          minX: worldPosition.x - Number(half[0]),
          maxX: worldPosition.x + Number(half[0]),
          minZ: worldPosition.z - Number(half[2]),
          maxZ: worldPosition.z + Number(half[2]),
          demoOnly: Boolean(object.userData?.demo_only),
          hiddenInDemo: Boolean(object.userData?.demo_hidden)
        });
      }
      object.visible = false;
    });

    const start = model.getObjectByName('Walk_Start');
    const target = model.getObjectByName('Walk_LookTarget');
    if (start) startPosition = start.getWorldPosition(new THREE.Vector3());
    if (target) startTarget = target.getWorldPosition(new THREE.Vector3());
    resolveBounds(model.getObjectByName('Walk_Bounds_Min'), model.getObjectByName('Walk_Bounds_Max'));
    const viewOrder = (view) => {
      if (Number.isFinite(Number(view.object.userData?.order))) return Number(view.object.userData.order);
      if (/VIEW_Entrance/i.test(view.object.name)) return 0;
      if (/VIEW_Overview/i.test(view.object.name)) return 1;
      const surface = view.object.name.match(/VIEW_Surface_(\d+)/i);
      if (surface) return 1 + Number(surface[1]);
      if (/VIEW_wARTrobe/i.test(view.object.name)) return 99;
      return 50;
    };
    views.sort((a, b) => viewOrder(a) - viewOrder(b));
    views.forEach((view) => {
      const targetName = view.object.userData?.target_node;
      view.target = targetName ? model.getObjectByName(targetName) : null;
    });
    refreshLabelMaterials();
    resetView();
    applyThemeTargets(true);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    clearCameraRailTimer();
    detachMotion();
    if (frameRequest) window.cancelAnimationFrame(frameRequest);
    listeners.splice(0).forEach((remove) => remove());
    resizeObserver.disconnect();
    animationMixer?.stopAllAction();
    animationMixer = null;
    disposeObject(model);
    environmentTexture.dispose();
    Object.values(detailTextures).forEach((texture) => texture.dispose?.());
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
    try { delete mount.__galleryController; } catch (error) { /* Non-critical debug handle cleanup. */ }
  };

  const adjustZoom = (amount) => {
    cancelCameraRail();
    setCameraFov(targetCameraFov + amount, false);
    ensureFrame();
  };

  const onWheel = (event) => {
    if (!active || !ready || destroyed || event.ctrlKey) return;
    event.preventDefault();
    const delta = event.deltaMode === 1
      ? event.deltaY * 16
      : event.deltaMode === 2
        ? event.deltaY * mount.clientHeight
        : event.deltaY;
    adjustZoom(clamp(delta * 0.018, -5.5, 5.5));
  };

  const onPointerDown = (event) => {
    if (!ready || event.button > 0 || !event.isPrimary) return;
    cancelCameraRail();
    pointer.id = event.pointerId;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
    pointer.dragged = false;
    if (motion.enabled) resetMotionBaseline();
    mount.setPointerCapture?.(event.pointerId);
    mount.classList.add('is-dragging');
  };

  const onPointerMove = (event) => {
    if (pointer.id === null) {
      mount.classList.toggle('has-interactive-target', Boolean(navigationHitAt(event.clientX, event.clientY)));
      return;
    }
    if (event.pointerId !== pointer.id) return;
    const x = event.clientX;
    const y = event.clientY;
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;
    if (Math.hypot(x - pointer.startX, y - pointer.startY) > 7) pointer.dragged = true;
    yaw = (yaw - dx * (compact ? 0.0052 : 0.0038)) % TAU;
    pitch = clamp(pitch - dy * (compact ? 0.0046 : 0.0034), -1.05, 1.05);
    currentViewIndex = -1;
    if (motion.enabled) resetMotionBaseline();
  };

  const releasePointer = (event) => {
    if (event.pointerId !== pointer.id) return;
    const wasDragged = pointer.dragged;
    mount.releasePointerCapture?.(event.pointerId);
    pointer.id = null;
    mount.classList.remove('is-dragging');
    if (!wasDragged && event.type !== 'pointercancel') activateNavigationAt(event.clientX, event.clientY);
    if (active && ready) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
  };

  const onKeyDown = (event) => {
    if (!active || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      if (!keys.has(event.code)) {
        if (event.code === 'KeyW' || event.code === 'ArrowUp') nudgePlayer('forward');
        if (event.code === 'KeyS' || event.code === 'ArrowDown') nudgePlayer('backward');
        if (event.code === 'KeyA') nudgePlayer('left');
        if (event.code === 'KeyD') nudgePlayer('right');
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
          yaw += event.code === 'ArrowLeft' ? 0.1 : -0.1;
          camera.rotation.set(pitch, yaw, 0, 'YXZ');
          renderer.render(scene, camera);
        }
      }
      keys.add(event.code);
    }
    if (['Equal', 'NumpadAdd', 'Minus', 'NumpadSubtract', 'Digit0', 'Numpad0'].includes(event.code)) {
      event.preventDefault();
      if (event.code === 'Equal' || event.code === 'NumpadAdd') adjustZoom(-4);
      else if (event.code === 'Minus' || event.code === 'NumpadSubtract') adjustZoom(4);
      else {
        cancelCameraRail({ preserveZoom: false });
        setCameraFov(baseCameraFov, false);
        ensureFrame();
      }
    }
    if (event.code === 'Home') {
      event.preventDefault();
      resetView();
    }
  };

  const onKeyUp = (event) => keys.delete(event.code);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  listen(mount, 'pointerdown', onPointerDown);
  listen(mount, 'pointermove', onPointerMove);
  listen(mount, 'pointerup', releasePointer);
  listen(mount, 'pointercancel', releasePointer);
  listen(mount, 'wheel', onWheel, { passive: false });
  listen(window, 'keydown', onKeyDown);
  listen(window, 'keyup', onKeyUp);
  listen(document, 'visibilitychange', ensureFrame);
  if (sidebarToggle) {
    listen(sidebarToggle, 'click', () => {
      setSidebarCollapsed(!sidebarCollapsed);
      triggerHaptic(5);
    });
  }
  listen(renderer.domElement, 'webglcontextlost', (event) => {
    event.preventDefault();
    setActive(false);
    call(options.onError, { reason: 'context-lost' });
  });

  root.querySelectorAll('[data-gallery-move]').forEach((button) => {
    const action = button.dataset.galleryMove;
    const press = (event) => {
      event.preventDefault();
      held.add(action);
      nudgePlayer(action);
      button.classList.add('is-held');
      button.setPointerCapture?.(event.pointerId);
    };
    const release = (event) => {
      held.delete(action);
      button.classList.remove('is-held');
      button.releasePointerCapture?.(event.pointerId);
    };
    listen(button, 'pointerdown', press);
    listen(button, 'pointerup', release);
    listen(button, 'pointercancel', release);
    listen(button, 'lostpointercapture', release);
  });

  const bindAnalogJoystick = (zone, target, { ignoreButtons = false } = {}) => {
    if (!zone) return;
    let pointerId = null;
    const setPosition = (x = 0, y = 0) => {
      target.x = x;
      target.y = y;
      zone.style.setProperty('--stick-x', `${(x * 24).toFixed(1)}px`);
      zone.style.setProperty('--stick-y', `${(y * 24).toFixed(1)}px`);
      zone.classList.toggle('is-engaged', Math.abs(x) + Math.abs(y) > 0.02);
      ensureFrame();
    };
    const update = (event) => {
      const rect = zone.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const radius = Math.max(28, Math.min(rect.width, rect.height) * 0.36);
      let x = (event.clientX - rect.left - rect.width / 2) / radius;
      let y = (event.clientY - rect.top - rect.height / 2) / radius;
      const length = Math.hypot(x, y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      if (length < 0.12) x = y = 0;
      setPosition(x, y);
    };
    const press = (event) => {
      if (pointerId !== null || !event.isPrimary) return;
      if (ignoreButtons && event.target.closest('[data-gallery-move]')) return;
      event.preventDefault();
      event.stopPropagation();
      pointerId = event.pointerId;
      zone.setPointerCapture?.(pointerId);
      triggerHaptic(6);
      update(event);
    };
    const move = (event) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      update(event);
    };
    const release = (event) => {
      if (pointerId === null || (event.pointerId != null && event.pointerId !== pointerId)) return;
      event.preventDefault?.();
      zone.releasePointerCapture?.(pointerId);
      pointerId = null;
      setPosition();
    };
    listen(zone, 'pointerdown', press);
    listen(zone, 'pointermove', move);
    listen(zone, 'pointerup', release);
    listen(zone, 'pointercancel', release);
    listen(zone, 'lostpointercapture', release);
  };

  bindAnalogJoystick(root.querySelector('[data-gallery-joystick="move"]'), analogMove, { ignoreButtons: true });
  bindAnalogJoystick(
    root.querySelector('[data-gallery-look-control]') || root.querySelector('[data-gallery-joystick="look"]'),
    analogLook
  );

  call(options.onLoading, { progress: null });
  const loader = new GLTFLoader();
  loader.load(
    options.modelUrl || 'assets/cinematic/danny-gallery-360.glb',
    (gltf) => {
      if (destroyed) {
        disposeObject(gltf.scene);
        return;
      }
      prepareModel(gltf);
      ready = true;
      resize();
      ensureFrame();
      call(options.onReady, {
        controller: api,
        views: views.length,
        artworks: new Set(artworkMeshes.map((mesh) => findMetadataOwner(mesh))).size,
        animations: animationClipCount
      });
    },
    (event) => call(options.onLoading, {
      progress: event.total > 0 ? event.loaded / event.total : null
    }),
    (error) => {
      call(options.onError, { reason: 'model-load-error', error });
      destroy();
    }
  );

  const api = {
    destroy,
    getState: () => ({
      active,
      camera: camera.position.toArray(),
      focusedArtwork,
      focusedSitePanel,
      activeNavigationId,
      animationClipCount,
      demoMode,
      motionEnabled: motion.enabled,
      motionSupported: motion.supported,
      pitch,
      ready,
      sidebarCollapsed,
      theme: currentTheme,
      zoom: {
        baseFov: baseCameraFov,
        fov: camera.fov,
        maximumFov: maximumCameraFov,
        minimumFov: minimumCameraFov,
        targetFov: targetCameraFov
      },
      views: views.map((view) => view.label),
      yaw
    }),
    goToNextView: () => goToWork(1),
    goToPreviousView: () => goToWork(-1),
    goToDemoRoom,
    goToSiteDirectory,
    goToSitePanel,
    requestMotionControl,
    resetView,
    setActive,
    setDemoMode,
    setTheme
  };

  Object.defineProperty(mount, '__galleryController', {
    configurable: true,
    value: api
  });

  return api;
}
