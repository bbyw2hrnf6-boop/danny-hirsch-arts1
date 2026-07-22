import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const TAU = Math.PI * 2;

const DARK_PALETTE = {
  wall: '#1a1c1a',
  architecture: '#151715',
  ceiling: '#0d0f0e',
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
  planter: '#28231d',
  botanical: '#51412e',
  botanical_leaf: '#725638',
  botanical_stem: '#3d2c1c',
  vessel: '#27231d'
};

const LIGHT_PALETTE = {
  wall: '#c1b8aa',
  architecture: '#989086',
  ceiling: '#8a8175',
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
  planter: '#8e8579',
  botanical: '#78664c',
  botanical_leaf: '#96734d',
  botanical_stem: '#64503a',
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
    if (cursor.userData?.asset_id || cursor.userData?.artwork_id || cursor.userData?.representation) return cursor;
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
  const paper = lightTheme ? '#e9e2d7' : '#c8bca8';
  const ink = lightTheme ? '#171611' : '#201b15';
  const gold = '#80602f';
  context.fillStyle = paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(255,255,255,.22)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(72,48,25,.08)');
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
  context.fillStyle = lightTheme ? '#4c4840' : '#494138';
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
      goToSitePanel() {},
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

  const compact = window.matchMedia('(max-width: 760px)').matches;
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.1 : lowPower ? 1 : 1.5));
  renderer.shadowMap.enabled = !compact && !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.tabIndex = -1;
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  const environmentTexture = createGalleryEnvironment(renderer);
  scene.environment = environmentTexture;
  const camera = new THREE.PerspectiveCamera(compact ? 68 : 62, 1, 0.04, 120);
  camera.rotation.order = 'YXZ';
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
  const pointer = { id: null, x: 0, y: 0 };
  const held = new Set();
  const keys = new Set();
  const colliders = [];
  const artworkMeshes = [];
  const sitePanelMeshes = [];
  const labelEntries = [];
  const themedMaterials = [];
  const importedLights = [];
  const views = [];
  const listeners = [];
  const playerRadius = 0.34;
  const detailTextures = {
    stone: createMicroNormalTexture('stone'),
    wood: createMicroNormalTexture('wood'),
    leather: createMicroNormalTexture('leather')
  };

  let destroyed = false;
  let active = false;
  let ready = false;
  let frameRequest = 0;
  let model = null;
  let currentTheme = options.theme === 'light' ? 'light' : 'dark';
  let yaw = 0;
  let pitch = 0;
  let bounds = { minX: -6.8, maxX: 6.8, minZ: -3.2, maxZ: 6.4 };
  let startPosition = new THREE.Vector3(0, 1.68, 4.8);
  let startTarget = new THREE.Vector3(0, 2.4, -2.8);
  let currentViewIndex = -1;
  let focusedArtwork = null;
  let focusedSitePanel = null;
  let demoMode = false;
  let lastFocusCheck = 0;
  let themeTransition = 1;

  const refreshLabelMaterials = () => {
    const lightTheme = currentTheme === 'light';
    labelEntries.forEach((entry) => {
      entry.material?.map?.dispose?.();
      entry.material?.dispose?.();
      const userData = entry.object.userData || {};
      const sitePanel = Boolean(userData.site_panel_id);
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
      entry.material = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        map: createLabelTexture(data, lightTheme, sitePanel),
        roughness: 0.32,
        metalness: 0.02,
        clearcoat: 0.22,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.52,
        side: THREE.DoubleSide
      });
      entry.object.material = entry.material;
      entry.object.visible = sitePanel ? demoMode : true;
    });
  };

  const listen = (target, type, handler, settings) => {
    target.addEventListener(type, handler, settings);
    listeners.push(() => target.removeEventListener(type, handler, settings));
  };

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

  const collides = (x, z) => colliders.some((box) => (
    x + playerRadius > box.minX
    && x - playerRadius < box.maxX
    && z + playerRadius > box.minZ
    && z - playerRadius < box.maxZ
  ));

  const movePlayer = (x, z) => {
    const nextX = clamp(x, bounds.minX + playerRadius, bounds.maxX - playerRadius);
    const nextZ = clamp(z, bounds.minZ + playerRadius, bounds.maxZ - playerRadius);
    if (!collides(nextX, camera.position.z)) camera.position.x = nextX;
    if (!collides(camera.position.x, nextZ)) camera.position.z = nextZ;
  };

  const orientToward = (target) => {
    camera.lookAt(target);
    lookEuler.setFromQuaternion(camera.quaternion, 'YXZ');
    pitch = clamp(lookEuler.x, -1.05, 1.05);
    yaw = lookEuler.y;
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  };

  const resetView = () => {
    camera.position.copy(startPosition);
    orientToward(startTarget);
    currentViewIndex = -1;
    call(options.onViewChange, { index: -1, label: 'Gallery entrance' });
    if (ready) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
  };

  const goToView = (index) => {
    if (!views.length) return resetView();
    currentViewIndex = (index + views.length) % views.length;
    const view = views[currentViewIndex];
    view.object.getWorldPosition(worldPosition);
    camera.position.copy(worldPosition);
    if (view.target) orientToward(view.target.getWorldPosition(new THREE.Vector3()));
    else orientToward(startTarget);
    call(options.onViewChange, {
      index: currentViewIndex,
      label: view.label,
      total: views.length
    });
    if (ready) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
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
    goToView(workIndices[nextWork]);
  };

  const applyThemeTargets = (instant = false) => {
    const isLight = currentTheme === 'light';
    const palette = isLight ? LIGHT_PALETTE : DARK_PALETTE;
    themedMaterials.forEach((entry) => {
      const color = palette[entry.role] || palette.architecture;
      entry.target.set(color);
      if (instant && entry.material.color) entry.material.color.copy(entry.target);
    });
    scene.background = new THREE.Color(isLight ? '#ddd5c8' : '#070807');
    if ('environmentIntensity' in scene) scene.environmentIntensity = isLight ? 0.62 : 0.54;
    scene.fog = new THREE.FogExp2(isLight ? '#c6bdaf' : '#080908', isLight ? 0.018 : 0.027);
    renderer.toneMappingExposure = isLight ? 0.82 : 0.70;
    ambient.intensity = isLight ? 0.68 : 0.072;
    hemisphere.intensity = isLight ? 0.92 : 0.23;
    hemisphere.color.set(isLight ? '#fff4df' : '#ffdda7');
    hemisphere.groundColor.set(isLight ? '#6b655c' : '#0c0f0d');
    importedLights.forEach((entry) => {
      // Blender's physically based light export is expressed in candela and is
      // intentionally much stronger than Three's small web exhibition needs.
      // Scale the original rig as a unit so the light geometry and artwork keep
      // their authored relationship without clipping pigment to flat white.
      entry.targetIntensity = entry.intensity * (isLight ? 0.005 : 0.0105);
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

  const updateArtworkFocus = () => {
    if (!artworkMeshes.length && !sitePanelMeshes.length) return;
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hit = raycaster.intersectObjects(demoMode ? [...artworkMeshes, ...sitePanelMeshes] : artworkMeshes, false)[0];
    let owner = hit ? findMetadataOwner(hit.object) : null;
    if (owner?.userData?.site_panel_id && hit.distance > 6.2) owner = null;
    if (owner?.userData?.site_panel_id) {
      const id = owner.userData.site_panel_id;
      if (id === focusedSitePanel?.id) return;
      focusedSitePanel = {
        id,
        title: owner.userData.site_title || 'Room information',
        kicker: owner.userData.site_kicker || '3D Site Demo',
        body: owner.userData.site_body || '',
        link: owner.userData.site_link || '',
        linkLabel: owner.userData.site_link_label || 'Open information'
      };
      focusedArtwork = null;
      call(options.onArtworkFocus, null);
      call(options.onSitePanelFocus, focusedSitePanel);
      return;
    }
    if (focusedSitePanel) {
      focusedSitePanel = null;
      call(options.onSitePanelFocus, null);
    }
    const id = owner?.userData?.asset_id || owner?.userData?.artwork_id || null;
    if (id === focusedArtwork?.id) return;
    focusedArtwork = owner ? {
      id,
      title: owner.userData.title || owner.userData.display_label || owner.userData.label || owner.name.replaceAll('_', ' '),
      detail: owner.userData.detail_label || owner.userData.medium || owner.userData.representation || 'Genuine artwork photography',
      source: owner.userData.source_asset || owner.userData.delivery_asset || '',
      representation: owner.userData.representation || '',
      collectionTitle: owner.userData.collection_title || owner.userData.title || '',
      year: owner.userData.year || '',
      medium: owner.userData.medium || '',
      dimensions: owner.userData.dimensions || '',
      availability: owner.userData.availability || owner.userData.status || '',
      description: owner.userData.description || ''
    } : null;
    call(options.onArtworkFocus, focusedArtwork);
  };

  const setDemoMode = (nextDemoMode) => {
    demoMode = Boolean(nextDemoMode);
    sitePanelMeshes.forEach((object) => { object.visible = demoMode; });
    if (!demoMode && focusedSitePanel) {
      focusedSitePanel = null;
      call(options.onSitePanelFocus, null);
    }
    call(options.onDemoModeChange, { active: demoMode, panels: sitePanelMeshes.length });
    if (ready) {
      camera.updateMatrixWorld(true);
      updateArtworkFocus();
      renderer.render(scene, camera);
    }
  };

  const goToSitePanel = (panelId) => {
    const index = views.findIndex((view) => view.object.userData?.demo_only && (
      !panelId || view.target?.userData?.site_panel_id === panelId
    ));
    if (index < 0) return;
    if (!demoMode) setDemoMode(true);
    goToView(index);
  };

  const updateMovement = (delta) => {
    const forwardInput = (keys.has('KeyW') || keys.has('ArrowUp') || held.has('forward') ? 1 : 0)
      - (keys.has('KeyS') || keys.has('ArrowDown') || held.has('backward') ? 1 : 0);
    const sideInput = (keys.has('KeyD') || held.has('right') ? 1 : 0)
      - (keys.has('KeyA') || held.has('left') ? 1 : 0);
    const turnInput = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
    if (turnInput) yaw -= turnInput * delta * 1.32;
    if (!forwardInput && !sideInput) return;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    right.set(-forward.z, 0, forward.x);
    candidate.copy(camera.position)
      .addScaledVector(forward, forwardInput * delta * (compact ? 1.28 : 1.52))
      .addScaledVector(right, sideInput * delta * (compact ? 1.12 : 1.34));
    movePlayer(candidate.x, candidate.z);
    currentViewIndex = -1;
  };

  const nudgePlayer = (action, distance = compact ? 0.2 : 0.24) => {
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
    updateMovement(delta);
    updateTheme(delta);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    const elapsed = clock.elapsedTime;
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
    model.updateMatrixWorld(true);
    const materialEntries = new Map();
    const colliderNodes = [];

    model.traverse((object) => {
      if (object.isCamera) object.visible = false;
      if (object.isLight) {
        importedLights.push({
          light: object,
          intensity: object.intensity,
          targetIntensity: object.intensity,
          color: object.color.clone()
        });
        object.castShadow = renderer.shadowMap.enabled && importedLights.length === 1;
        if (object.shadow) {
          object.shadow.mapSize.set(1024, 1024);
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
      if (object.userData?.catalogue_label || object.userData?.site_panel_id) {
        labelEntries.push({ object, material: null });
        if (object.userData?.site_panel_id) {
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
          const reflective = /floor_tile|floor_alt|bronze|plaque|planter|wood|leather/.test(role);
          material.envMapIntensity = reflective ? (/bronze|plaque_text/.test(role) ? 1.15 : 0.72) : 0.22;
          if ('clearcoat' in material) {
            material.clearcoat = Number(material.userData?.web_clearcoat ?? material.clearcoat ?? 0);
            material.clearcoatRoughness = Number(material.userData?.web_clearcoat_roughness ?? material.clearcoatRoughness ?? 0.2);
          }
          if (/floor_tile|floor_alt|stone|wall/.test(role)) {
            material.normalMap = detailTextures.stone;
            material.normalScale?.set(0.17, 0.17);
          } else if (role === 'wood') {
            material.normalMap = detailTextures.wood;
            material.normalScale?.set(0.28, 0.28);
          } else if (/leather/.test(role)) {
            material.normalMap = detailTextures.leather;
            material.normalScale?.set(0.20, 0.20);
          }
          material.needsUpdate = true;
          const target = new THREE.Color();
          materialEntries.set(material, { material, role, target });
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
          maxZ: worldPosition.z + Number(half[2])
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
    if (frameRequest) window.cancelAnimationFrame(frameRequest);
    listeners.splice(0).forEach((remove) => remove());
    resizeObserver.disconnect();
    disposeObject(model);
    environmentTexture.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
    try { delete mount.__galleryController; } catch (error) { /* Non-critical debug handle cleanup. */ }
  };

  const onPointerDown = (event) => {
    if (!ready || event.button > 0 || !event.isPrimary) return;
    pointer.id = event.pointerId;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    mount.setPointerCapture?.(event.pointerId);
    mount.classList.add('is-dragging');
  };

  const onPointerMove = (event) => {
    if (event.pointerId !== pointer.id) return;
    const x = event.clientX;
    const y = event.clientY;
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;
    yaw = (yaw - dx * (compact ? 0.0052 : 0.0038)) % TAU;
    pitch = clamp(pitch - dy * (compact ? 0.0046 : 0.0034), -1.05, 1.05);
    currentViewIndex = -1;
  };

  const releasePointer = (event) => {
    if (event.pointerId !== pointer.id) return;
    mount.releasePointerCapture?.(event.pointerId);
    pointer.id = null;
    mount.classList.remove('is-dragging');
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
  listen(window, 'keydown', onKeyDown);
  listen(window, 'keyup', onKeyUp);
  listen(document, 'visibilitychange', ensureFrame);
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
      call(options.onReady, { controller: api, views: views.length, artworks: new Set(artworkMeshes.map((mesh) => findMetadataOwner(mesh))).size });
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
      demoMode,
      pitch,
      ready,
      theme: currentTheme,
      views: views.map((view) => view.label),
      yaw
    }),
    goToNextView: () => goToWork(1),
    goToPreviousView: () => goToWork(-1),
    goToSitePanel,
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
