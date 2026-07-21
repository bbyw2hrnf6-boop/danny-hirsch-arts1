import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DEFAULT_STAGE_SELECTOR = '#private-room .private-room-stage';
const DEFAULT_MODEL_URL = 'assets/cinematic/threshold-room.glb';
const INSTANCES = new WeakMap();

const STATUS_CLASSES = [
  'private-room--3d-idle',
  'private-room--3d-loading',
  'private-room--3d-ready',
  'private-room--3d-error',
  'private-room--3d-skipped',
  'private-room--3d-destroyed'
];

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const callSafely = (callback, payload) => {
  if (typeof callback !== 'function') return;

  try {
    callback(payload);
  } catch (error) {
    // Consumer callbacks must never interrupt the rendering lifecycle.
    window.setTimeout(() => console.error(error), 0);
  }
};

const resolveElement = (target) => {
  if (target instanceof Element) return target;
  if (typeof target === 'string') return document.querySelector(target);
  return null;
};

const dispatchStateEvent = (stage, detail) => {
  stage.dispatchEvent(new CustomEvent('private-room-3d:state', {
    bubbles: true,
    detail
  }));
};

const detectWebGL2 = () => {
  if (!window.WebGL2RenderingContext) return false;

  const probe = document.createElement('canvas');
  const context = probe.getContext('webgl2', {
    antialias: false,
    depth: false,
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'high-performance',
    stencil: false
  });

  if (!context) return false;

  context.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
};

const getConnection = () => (
  navigator.connection || navigator.mozConnection || navigator.webkitConnection
);

const getSkipReason = (options, reducedMotionQuery) => {
  if (options.enabled === false) return 'disabled';
  if (reducedMotionQuery.matches && options.respectReducedMotion !== false) return 'reduced-motion';
  if (getConnection()?.saveData && options.respectSaveData !== false) return 'save-data';
  if (!detectWebGL2()) return 'webgl2-unavailable';

  if (Number.isFinite(options.minimumDeviceMemory)
    && Number.isFinite(navigator.deviceMemory)
    && navigator.deviceMemory < options.minimumDeviceMemory) {
    return 'limited-memory';
  }

  if (Number.isFinite(options.minimumHardwareConcurrency)
    && Number.isFinite(navigator.hardwareConcurrency)
    && navigator.hardwareConcurrency < options.minimumHardwareConcurrency) {
    return 'limited-cpu';
  }

  return null;
};

const disposeScene = (root) => {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);

    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    objectMaterials.filter(Boolean).forEach((material) => {
      materials.add(material);

      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  textures.forEach((texture) => {
    if (typeof texture.image?.close === 'function') texture.image.close();
    texture.dispose();
  });
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
};

/**
 * Progressive-enhancement renderer for the Private Room.
 *
 * The returned function is always safe to call, including when 3D was skipped.
 * DOM artwork, copy, links and controls are deliberately left untouched so the
 * semantic fallback remains present below the decorative canvas.
 */
export function initPrivateRoom3D(options = {}) {
  const defaultStage = resolveElement(DEFAULT_STAGE_SELECTOR)
    || resolveElement('[data-private-room-stage]')
    || resolveElement('#installation .room-stage');
  const stage = resolveElement(options.stage || options.stageSelector) || defaultStage;

  if (!stage) {
    callSafely(options.onSkip, { reason: 'missing-stage' });
    return () => {};
  }

  if (INSTANCES.has(stage)) return INSTANCES.get(stage);

  const root = resolveElement(options.root || options.rootSelector)
    || stage.closest('#private-room, #installation, section')
    || stage;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const skipReason = getSkipReason(options, reducedMotionQuery);

  let destroyed = false;
  let failed = false;
  let booted = false;
  let ready = false;
  let inViewport = false;
  let documentVisible = !document.hidden;
  let contextLost = false;
  let frameRequest = 0;
  let lastFrameTime = 0;
  let loadTimer = 0;
  let revealTimer = 0;
  let renderer = null;
  let scene = null;
  let model = null;
  let camera = null;
  let cameraRig = null;
  let mixer = null;
  let hasRepeatingAnimation = false;
  let animationTimeRemaining = 0;
  let resizeObserver = null;
  let lazyObserver = null;
  let visibilityObserver = null;
  let themeObserver = null;
  let canvas = null;
  let sceneRadius = 1;
  let scrollTarget = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let scrollPosition = 0;
  let baseCameraPosition = new THREE.Vector3();
  let baseCameraQuaternion = new THREE.Quaternion();
  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const deltaQuaternion = new THREE.Quaternion();
  const deltaEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const cameraForward = new THREE.Vector3();
  const fallbackLights = [];
  const themeLights = [];
  const architectureMaterials = [];
  let currentTheme = (options.theme || document.body?.dataset.theme) === 'light' ? 'light' : 'dark';
  const previousStagePosition = stage.style.position;

  const setStatus = (status, detail = {}) => {
    STATUS_CLASSES.forEach((className) => root.classList.remove(className));
    root.classList.add(`private-room--3d-${status}`);
    root.dataset.privateRoom3d = status;

    const payload = { state: status, stage, root, ...detail };
    dispatchStateEvent(stage, payload);
    callSafely(options.onStateChange, payload);
  };

  const setActivityClass = () => {
    const active = ready && inViewport && documentVisible && !contextLost && !destroyed;
    root.classList.toggle('private-room--3d-active', active);
    root.classList.toggle('private-room--3d-paused', ready && !active);
  };

  const trackThemeLight = (light) => {
    if (!light?.isLight || themeLights.some((entry) => entry.light === light)) return;
    themeLights.push({
      light,
      color: light.color?.clone(),
      intensity: light.intensity
    });
  };

  function setTheme(theme) {
    if (destroyed) return currentTheme;
    currentTheme = theme === 'light' ? 'light' : 'dark';
    const isLight = currentTheme === 'light';
    root.classList.toggle('private-room--3d-theme-light', isLight);
    root.classList.toggle('private-room--3d-theme-dark', !isLight);

    if (scene) {
      scene.background = new THREE.Color(
        isLight
          ? (options.lightBackground || '#e6ded1')
          : (options.darkBackground || '#080808')
      );
    }

    if (renderer) {
      renderer.toneMappingExposure = isLight
        ? (options.lightToneMappingExposure ?? 1.16)
        : (options.toneMappingExposure ?? 1);
    }

    architectureMaterials.forEach((entry) => {
      const { material } = entry;

      if (material.color) {
        if (isLight) material.color.set(options.lightArchitectureColor || '#d8d0c2');
        else material.color.copy(entry.color);
      }

      if (material.emissive && entry.emissive) {
        if (isLight) {
          material.emissive.set(options.lightArchitectureEmissive || '#393329');
          material.emissiveIntensity = Math.max(
            entry.emissiveIntensity,
            options.lightArchitectureEmissiveIntensity ?? 0.13
          );
        } else {
          material.emissive.copy(entry.emissive);
          material.emissiveIntensity = entry.emissiveIntensity;
        }
      }

      material.needsUpdate = true;
    });

    const warmLight = new THREE.Color(options.lightLampColor || '#ffe3b6');
    themeLights.forEach((entry) => {
      if (entry.color) {
        if (isLight) entry.light.color.copy(entry.color).lerp(warmLight, 0.24);
        else entry.light.color.copy(entry.color);
      }
      entry.light.intensity = isLight
        ? entry.intensity * (options.lightIntensityMultiplier ?? 1.3)
        : entry.intensity;
    });

    requestRender();
    callSafely(options.onThemeChange, { theme: currentTheme, stage, root });
    return currentTheme;
  }

  const clearProgress = () => {
    root.style.removeProperty('--private-room-3d-progress');
  };

  const updateProgress = (event) => {
    const total = Number(event?.total) || 0;
    const loaded = Number(event?.loaded) || 0;
    const progress = total > 0 ? clamp(loaded / total, 0, 1) : null;

    if (progress !== null) {
      root.style.setProperty('--private-room-3d-progress', progress.toFixed(4));
    }

    callSafely(options.onLoading, { progress, loaded, total, stage, root });
  };

  const render = (time = performance.now()) => {
    frameRequest = 0;
    if (!ready || destroyed || contextLost || !inViewport || !documentVisible) return;

    const delta = Math.min(0.05, Math.max(0, (time - (lastFrameTime || time)) / 1000));
    lastFrameTime = time;
    const damping = 1 - Math.exp(-delta * (options.cameraDamping || 5.5));

    pointerX += (pointerTargetX - pointerX) * damping;
    pointerY += (pointerTargetY - pointerY) * damping;
    scrollPosition += (scrollTarget - scrollPosition) * damping;

    const pointerRotation = options.pointerRotation ?? 0.018;
    const scrollRotation = options.scrollRotation ?? 0.012;
    const positionScale = sceneRadius * (options.cameraTravel ?? 0.022);

    cameraRight.set(1, 0, 0).applyQuaternion(baseCameraQuaternion);
    cameraUp.set(0, 1, 0).applyQuaternion(baseCameraQuaternion);
    cameraForward.set(0, 0, -1).applyQuaternion(baseCameraQuaternion);

    targetPosition.copy(baseCameraPosition)
      .addScaledVector(cameraRight, pointerX * positionScale)
      .addScaledVector(cameraUp, (-pointerY + scrollPosition * 0.72) * positionScale)
      .addScaledVector(cameraForward, scrollPosition * positionScale * 0.34);

    deltaEuler.set(
      -pointerY * pointerRotation - scrollPosition * scrollRotation * 0.35,
      pointerX * pointerRotation + scrollPosition * scrollRotation,
      0
    );
    deltaQuaternion.setFromEuler(deltaEuler);
    targetQuaternion.copy(baseCameraQuaternion).multiply(deltaQuaternion);

    cameraRig.position.lerp(targetPosition, damping);
    cameraRig.quaternion.slerp(targetQuaternion, damping);
    const animationIsRunning = hasRepeatingAnimation || animationTimeRemaining > 0;
    if (mixer && animationIsRunning) {
      mixer.update(delta);
      animationTimeRemaining = Math.max(0, animationTimeRemaining - delta);
    }
    renderer.render(scene, camera);

    const cameraIsMoving = Math.abs(pointerTargetX - pointerX)
      + Math.abs(pointerTargetY - pointerY)
      + Math.abs(scrollTarget - scrollPosition) > 0.001;

    if (animationIsRunning || cameraIsMoving) frameRequest = requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (frameRequest || !ready || destroyed || contextLost || !inViewport || !documentVisible) return;
    frameRequest = requestAnimationFrame(render);
  };

  const resize = () => {
    if (!renderer || !camera || destroyed) return;

    const bounds = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const aspect = width / height;
    const pixelRatioCap = options.pixelRatioCap
      ?? (window.matchMedia('(pointer: coarse)').matches ? 1 : 1.5);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setSize(width, height, false);

    if (camera.isPerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    } else if (camera.isOrthographicCamera) {
      const verticalSpan = camera.userData.privateRoomVerticalSpan
        || Math.abs(camera.top - camera.bottom)
        || 2;
      camera.left = -(verticalSpan * aspect) / 2;
      camera.right = (verticalSpan * aspect) / 2;
      camera.top = verticalSpan / 2;
      camera.bottom = -verticalSpan / 2;
      camera.updateProjectionMatrix();
    }

    requestRender();
  };

  const updateScrollTarget = () => {
    const bounds = root.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    const sectionCenter = bounds.top + bounds.height / 2;
    const travel = Math.max(viewportHeight, bounds.height);
    scrollTarget = clamp((viewportHeight / 2 - sectionCenter) / travel, -1, 1);
    requestRender();
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;

    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    pointerTargetX = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    pointerTargetY = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
    requestRender();
  };

  const handlePointerLeave = () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    requestRender();
  };

  const handleVisibilityChange = () => {
    documentVisible = !document.hidden;
    lastFrameTime = 0;
    setActivityClass();
    requestRender();
  };

  const handleContextLost = (event) => {
    if (destroyed) return;
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    canvas.style.opacity = '0';
    root.classList.add('private-room--3d-context-lost');
    setActivityClass();
    callSafely(options.onContextLost, { stage, root });
  };

  const handleContextRestored = () => {
    if (destroyed) return;
    contextLost = false;
    root.classList.remove('private-room--3d-context-lost');
    canvas.style.opacity = '1';
    resize();
    setActivityClass();
    requestRender();
    callSafely(options.onContextRestored, { stage, root });
  };

  const removeRuntimeListeners = () => {
    window.removeEventListener('scroll', updateScrollTarget);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    stage.removeEventListener('pointermove', handlePointerMove);
    stage.removeEventListener('pointerleave', handlePointerLeave);
    canvas?.removeEventListener('webglcontextlost', handleContextLost);
    canvas?.removeEventListener('webglcontextrestored', handleContextRestored);
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const fail = (error) => {
    if (destroyed || failed) return;
    failed = true;
    ready = false;
    window.clearTimeout(loadTimer);
    window.clearTimeout(revealTimer);
    clearProgress();
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    removeRuntimeListeners();
    canvas?.remove();
    canvas = null;
    disposeScene(model);
    model = null;
    renderer?.dispose();
    renderer = null;
    setStatus('error', { error });
    root.classList.remove('private-room--3d-active', 'private-room--3d-paused');
    callSafely(options.onError, { error, stage, root });
  };

  const makePresentationCamera = (sourceCamera, bounds) => {
    let source = sourceCamera;

    if (!source) {
      source = new THREE.PerspectiveCamera(38, 1, 0.05, Math.max(100, sceneRadius * 40));
      const center = bounds.getCenter(new THREE.Vector3());
      const halfFov = THREE.MathUtils.degToRad(source.fov / 2);
      const distance = sceneRadius / Math.max(0.1, Math.sin(halfFov)) * 1.08;
      source.position.set(center.x, center.y + sceneRadius * 0.08, center.z + distance);
      source.lookAt(center);
      source.updateMatrixWorld(true);
    } else {
      source.updateWorldMatrix(true, false);
    }

    const presentationCamera = source.clone(false);
    source.getWorldPosition(baseCameraPosition);
    source.getWorldQuaternion(baseCameraQuaternion);

    cameraRig = new THREE.Group();
    cameraRig.name = 'PrivateRoomCameraRig';
    cameraRig.position.copy(baseCameraPosition);
    cameraRig.quaternion.copy(baseCameraQuaternion);
    scene.add(cameraRig);

    presentationCamera.position.set(0, 0, 0);
    presentationCamera.quaternion.identity();
    presentationCamera.scale.set(1, 1, 1);
    presentationCamera.name = 'PrivateRoomPresentationCamera';
    if (presentationCamera.isOrthographicCamera) {
      presentationCamera.userData.privateRoomVerticalSpan = Math.abs(
        presentationCamera.top - presentationCamera.bottom
      );
    }
    cameraRig.add(presentationCamera);
    return presentationCamera;
  };

  const prepareMaterials = () => {
    const maximumAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    model.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];

      materials.filter(Boolean).forEach((material) => {
        const name = `${object.name} ${material.name}`;
        const preservesArtworkColour = /art(?:work)?|surface|painting|wartrobe[_ -]?front/i.test(name);
        const isArchitecture = /architecture|ceiling|floor|room|wall|plinth|bench/i.test(name)
          && !preservesArtworkColour;

        ['map', 'emissiveMap'].forEach((key) => {
          if (!material[key]) return;
          material[key].anisotropy = maximumAnisotropy;
          if (preservesArtworkColour) material[key].colorSpace = THREE.SRGBColorSpace;
        });

        if (preservesArtworkColour) material.toneMapped = false;

        if (isArchitecture && material.color) {
          architectureMaterials.push({
            material,
            color: material.color.clone(),
            emissive: material.emissive?.clone(),
            emissiveIntensity: material.emissiveIntensity || 0
          });
        }
      });
    });
  };

  const startAnimations = (animations = []) => {
    if (!animations.length) return;

    mixer = new THREE.AnimationMixer(model);
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      const repeats = /ambient|loop|dust|light/i.test(clip.name);
      hasRepeatingAnimation ||= repeats;
      if (!repeats) animationTimeRemaining = Math.max(animationTimeRemaining, clip.duration || 0);
      action.setLoop(repeats ? THREE.LoopRepeat : THREE.LoopOnce, repeats ? Infinity : 1);
      action.clampWhenFinished = !repeats;
      action.play();
    });
  };

  const finalizeLoad = (gltf) => {
    if (destroyed || failed) {
      disposeScene(gltf.scene);
      return;
    }

    window.clearTimeout(loadTimer);
    model = gltf.scene;
    model.name ||= 'ThresholdRoom';
    scene.add(model);

    const bounds = new THREE.Box3().setFromObject(model);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    sceneRadius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 1;

    const hasLight = (() => {
      let found = false;
      model.traverse((object) => { if (object.isLight) found = true; });
      return found;
    })();

    if (!hasLight && options.addFallbackLights !== false) {
      const hemisphere = new THREE.HemisphereLight(0xe9dcc5, 0x090a0b, 0.65);
      const key = new THREE.DirectionalLight(0xffe6bd, 1.2);
      key.position.set(sceneRadius * -0.7, sceneRadius, sceneRadius * 0.8);
      fallbackLights.push(hemisphere, key);
      scene.add(hemisphere, key);
    }

    model.traverse(trackThemeLight);
    fallbackLights.forEach(trackThemeLight);

    camera = makePresentationCamera(
      gltf.cameras?.find((candidate) => candidate.isPerspectiveCamera || candidate.isOrthographicCamera),
      bounds
    );
    prepareMaterials();
    setTheme(currentTheme);
    // The Blender opening camera belongs to the pre-rendered hero film. The
    // Private Room keeps a curated camera and only accepts true ambient loops.
    startAnimations(gltf.animations.filter((clip) => /ambient|loop|dust|light/i.test(clip.name)));
    resize();

    try {
      renderer.compile(scene, camera);
    } catch {
      // A normal render below still compiles on browsers without pre-compilation.
    }

    if (destroyed) return;

    renderer.render(scene, camera);
    // Let the first GPU texture upload settle behind the accurate DOM
    // fallback. Without this short hand-off, some Chromium/Metal devices can
    // expose one black artwork frame even though the model itself is ready.
    revealTimer = window.setTimeout(() => {
      if (destroyed || failed) return;
      renderer.render(scene, camera);
      ready = true;
      clearProgress();
      setStatus('ready');
      canvas.style.opacity = '1';
      setActivityClass();
      requestRender();
      callSafely(options.onReady, { renderer, scene, camera, model, stage, root });
    }, options.revealDelay ?? 480);
  };

  const boot = () => {
    if (booted || destroyed) return;
    booted = true;
    setStatus('loading');
    callSafely(options.onLoading, { progress: 0, loaded: 0, total: 0, stage, root });

    canvas = document.createElement('canvas');
    canvas.className = options.canvasClass || 'private-room-webgl';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('tabindex', '-1');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'display:block',
      'width:100%',
      'height:100%',
      `z-index:${options.canvasZIndex ?? 1}`,
      'pointer-events:none',
      'opacity:0',
      `transition:opacity ${options.fadeDuration ?? 800}ms cubic-bezier(.22,.61,.36,1)`
    ].join(';');

    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    stage.append(canvas);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: options.antialias !== false,
        depth: true,
        failIfMajorPerformanceCaveat: true,
        powerPreference: options.powerPreference || 'high-performance',
        // The room renders on demand, not continuously. Preserve its last
        // curated frame so mobile compositors do not clear a paused canvas.
        preserveDrawingBuffer: options.preserveDrawingBuffer !== false,
        stencil: false
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = options.toneMapping ?? THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = currentTheme === 'light'
        ? (options.lightToneMappingExposure ?? 1.16)
        : (options.toneMappingExposure ?? 1);
      renderer.shadowMap.enabled = options.shadows === true;
      if (renderer.shadowMap.enabled) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (error) {
      fail(error);
      return;
    }

    scene = new THREE.Scene();
    scene.name = 'PrivateRoomWebGLScene';
    setTheme(currentTheme);
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    stage.addEventListener('pointermove', handlePointerMove, { passive: true });
    stage.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }

    updateScrollTarget();
    resize();

    const timeout = Math.max(3000, options.loadTimeout ?? 20000);
    loadTimer = window.setTimeout(() => {
      fail(new Error(`Private Room 3D timed out after ${timeout}ms.`));
    }, timeout);

    const modelUrl = new URL(options.modelUrl || DEFAULT_MODEL_URL, document.baseURI).href;
    const loader = new GLTFLoader();
    loader.load(modelUrl, finalizeLoad, updateProgress, fail);
  };

  const handleReducedMotionChange = (event) => {
    if (!event.matches || options.respectReducedMotion === false || destroyed) return;

    // A live preference change should immediately reveal the static DOM fallback.
    destroy();
    callSafely(options.onSkip, { reason: 'reduced-motion', stage, root });
  };

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    ready = false;
    window.clearTimeout(loadTimer);
    window.clearTimeout(revealTimer);
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    lazyObserver?.disconnect();
    visibilityObserver?.disconnect();
    removeRuntimeListeners();
    reducedMotionQuery.removeEventListener?.('change', handleReducedMotionChange);
    themeObserver?.disconnect();
    mixer?.stopAllAction();
    if (mixer && model) mixer.uncacheRoot(model);
    disposeScene(model);
    fallbackLights.forEach((light) => scene?.remove(light));
    renderer?.dispose();
    renderer?.forceContextLoss();
    canvas?.remove();
    clearProgress();
    root.classList.remove(
      'private-room--3d-capable',
      'private-room--3d-active',
      'private-room--3d-paused',
      'private-room--3d-context-lost',
      'private-room--3d-theme-light',
      'private-room--3d-theme-dark'
    );
    setStatus('destroyed');
    stage.style.position = previousStagePosition;
    INSTANCES.delete(stage);
  }

  destroy.destroy = destroy;
  destroy.setTheme = setTheme;
  destroy.getTheme = () => currentTheme;

  INSTANCES.set(stage, destroy);

  if (skipReason) {
    setStatus('skipped', { reason: skipReason });
    callSafely(options.onSkip, { reason: skipReason, stage, root });
    return destroy;
  }

  root.classList.add('private-room--3d-capable');
  setStatus('idle');
  setTheme(currentTheme);
  reducedMotionQuery.addEventListener?.('change', handleReducedMotionChange);

  if (document.body && 'MutationObserver' in window) {
    themeObserver = new MutationObserver(() => setTheme(document.body.dataset.theme));
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }

  const updateVisibility = (entries) => {
    const entry = entries[entries.length - 1];
    inViewport = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0);
    lastFrameTime = 0;
    setActivityClass();
    requestRender();
  };

  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(updateVisibility, { threshold: [0, 0.01] });
    visibilityObserver.observe(stage);

    lazyObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      lazyObserver.disconnect();
      boot();
    }, {
      rootMargin: options.rootMargin || '800px 0px',
      threshold: 0.01
    });
    lazyObserver.observe(stage);
  } else {
    const bounds = stage.getBoundingClientRect();
    inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
    window.setTimeout(boot, 0);
  }

  return destroy;
}

export default initPrivateRoom3D;
