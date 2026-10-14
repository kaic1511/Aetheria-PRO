import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const CFG = window.AETHERIA_CONFIG;
const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 768;

// ============================================================================
// 1. SCENE, CAMERA, RENDERER & HDR UNREAL BLOOM PIPELINE
// ============================================================================
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030308, 0.028);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 120);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true // Enables 4K PNG snapshot export
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2));
renderer.setClearColor(0x030308, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// Post-Processing Composer with UnrealBloomPass
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85, // Strength
  0.55, // Radius
  0.22  // Threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Portrait Aspect Ratio Scaling so 3D rings never clip on mobile phones
function getPortraitScale() {
  const aspect = window.innerWidth / window.innerHeight;
  return aspect < 1.0 ? Math.min(1.68, 1.0 / Math.pow(aspect, 0.54)) : 1.0;
}

// ============================================================================
// 2. 3D GEOMETRIES, SHADER CORE, ACCRETION HALO & ORBITAL SATELLITES
// ============================================================================
const worldGroup = new THREE.Group();
scene.add(worldGroup);

const coreGroup = new THREE.Group();
worldGroup.add(coreGroup);

const seg = isMobile ? 88 : 128;
const geometries = {
  sphere: new THREE.SphereGeometry(1.42, seg, seg),
  torusknot: new THREE.TorusKnotGeometry(0.98, 0.33, isMobile ? 150 : 220, 40, 2, 3),
  starburst: new THREE.TorusKnotGeometry(0.95, 0.24, isMobile ? 160 : 240, 36, 3, 7),
  torus: new THREE.TorusGeometry(1.12, 0.44, 72, isMobile ? 130 : 180),
  icosa: new THREE.IcosahedronGeometry(1.46, isMobile ? 16 : 24),
  octa: new THREE.OctahedronGeometry(1.52, isMobile ? 12 : 18)
};

const uniforms = {
  uTime: { value: 0 },
  uMorphStrength: { value: 0.42 },
  uFrequency: { value: 1.75 },
  uGlow: { value: 1.45 },
  uPulse: { value: 0.0 },
  uBeat: { value: 0.0 },
  uMouse3D: { value: new THREE.Vector3(0, 0, 2) },
  uColorA: { value: new THREE.Color(CFG.themes[0].colorA) },
  uColorB: { value: new THREE.Color(CFG.themes[0].colorB) },
  uColorC: { value: new THREE.Color(CFG.themes[0].colorC) }
};

const coreMaterial = new THREE.ShaderMaterial({
  vertexShader: CFG.coreVertexShader,
  fragmentShader: CFG.coreFragmentShader,
  uniforms
});

const coreMesh = new THREE.Mesh(geometries.sphere, coreMaterial);
coreGroup.add(coreMesh);

// Dual Holographic Wireframe Cage
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(CFG.themes[0].accentHex),
  wireframe: true,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending
});
const wireframeMesh = new THREE.Mesh(geometries.sphere, wireframeMaterial);
wireframeMesh.scale.setScalar(1.045);
coreGroup.add(wireframeMesh);

// Swirling Plasma Accretion Disk Halo
const haloUniforms = {
  uTime: { value: 0 },
  uColorB: { value: new THREE.Color(CFG.themes[0].colorB) },
  uColorC: { value: new THREE.Color(CFG.themes[0].colorC) },
  uPulse: { value: 0 }
};

const haloMaterial = new THREE.ShaderMaterial({
  vertexShader: CFG.haloVertexShader,
  fragmentShader: CFG.haloFragmentShader,
  uniforms: haloUniforms,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending
});

const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), haloMaterial);
haloMesh.rotation.x = Math.PI * 0.44;
coreGroup.add(haloMesh);

// Gyroscopic Rings
const ringMat1 = new THREE.MeshBasicMaterial({
  color: new THREE.Color(CFG.themes[0].accentHex),
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide
});
const ringMat2 = new THREE.MeshBasicMaterial({
  color: new THREE.Color(CFG.themes[0].accent2Hex),
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide
});

const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.009, 16, 160), ringMat1);
ring1.rotation.x = Math.PI * 0.42;
coreGroup.add(ring1);

const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.007, 16, 160), ringMat2);
ring2.rotation.y = Math.PI * 0.32;
ring2.rotation.x = Math.PI * 0.22;
coreGroup.add(ring2);

// Orbiting Crystalline Monoliths
const satellitesGroup = new THREE.Group();
coreGroup.add(satellitesGroup);

const satGeo = new THREE.OctahedronGeometry(0.11, 0);
const satMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: new THREE.Color(CFG.themes[0].accentHex),
  emissiveIntensity: 1.1,
  metalness: 0.88,
  roughness: 0.12
});

const satellites = [];
for (let i = 0; i < 14; i++) {
  const mesh = new THREE.Mesh(satGeo, satMat);
  const radius = 2.15 + Math.random() * 1.45;
  const angle = (i / 14) * Math.PI * 2;
  const speed = 0.24 + Math.random() * 0.45;
  const yOffset = (Math.random() - 0.5) * 1.75;
  satellites.push({ mesh, radius, angle, speed, yOffset });
  satellitesGroup.add(mesh);
}

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const pointLight1 = new THREE.PointLight(0x00f0ff, 3.0, 22);
pointLight1.position.set(4, 4, 4);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x7c5cff, 3.0, 22);
pointLight2.position.set(-4, -3, 3);
scene.add(pointLight2);

// ============================================================================
// 3. INTERACTIVE GRAVITY & HYPERDRIVE PARTICLE FIELD
// ============================================================================
const particleCount = isMobile ? 3500 : 6000;
document.getElementById('particle-counter').textContent = particleCount.toLocaleString();

const particleGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
const scaleArray = new Float32Array(particleCount);
const speedArray = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  const r = 2.6 + Math.pow(Math.random(), 1.35) * 15.0;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  posArray[i * 3 + 2] = r * Math.cos(phi);
  scaleArray[i] = Math.random();
  speedArray[i] = 0.4 + Math.random() * 1.2;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particleGeo.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));
particleGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speedArray, 1));

const particleMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uWarp: { value: 0.0 },
    uAttractor: { value: new THREE.Vector3(0, 0, 0) },
    uColorB: { value: new THREE.Color(CFG.themes[0].colorB) },
    uColorC: { value: new THREE.Color(CFG.themes[0].colorC) },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  },
  vertexShader: CFG.particleVertexShader,
  fragmentShader: CFG.particleFragmentShader
});

const particleSystem = new THREE.Points(particleGeo, particleMat);
worldGroup.add(particleSystem);

// ============================================================================
// 4. MULTI-TOUCH (ORBIT, PINCH ZOOM, DOUBLE-TAP) & CHAPTER CHOREOGRAPHY
// ============================================================================
const cursorRing = document.getElementById('cursor-ring');
let pointerX = 0, pointerY = 0;
let userRotX = 0, userRotY = 0;
let targetRotX = 0, targetRotY = 0;
let pinchZoomScale = 1.0;
let targetPinchZoom = 1.0;

let currentChapter = 0;
const targetCamPos = new THREE.Vector3();
const targetCoreOffset = new THREE.Vector3();
const targetColorA = new THREE.Color(CFG.themes[0].colorA);
const targetColorB = new THREE.Color(CFG.themes[0].colorB);
const targetColorC = new THREE.Color(CFG.themes[0].colorC);

function syncChapterTargets() {
  const ch = CFG.chapters[currentChapter];
  const pScale = getPortraitScale();
  targetCamPos.set(...ch.camPos).multiplyScalar(pScale);
  const isPortrait = window.innerWidth < 920;
  targetCoreOffset.set(...(isPortrait ? ch.mobileOffset : ch.desktopOffset));
}

syncChapterTargets();
camera.position.copy(targetCamPos);
coreGroup.position.copy(targetCoreOffset);

function spawnTouchRipple(x, y) {
  const ripple = document.createElement('div');
  ripple.className = 'touch-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

const activePointers = new Map();
let initialPinchDist = null;
let initialPinchZoom = 1.0;
let lastTapTime = 0;

canvas.addEventListener('pointerdown', (e) => {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  cursorRing.classList.add('active');

  const now = performance.now();
  if (activePointers.size === 1 && (now - lastTapTime < 300)) {
    triggerPulseWave();
    spawnTouchRipple(e.clientX, e.clientY);
  }
  lastTapTime = now;

  if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    initialPinchZoom = targetPinchZoom;
  }
});

window.addEventListener('pointermove', (e) => {
  cursorRing.style.left = `${e.clientX}px`;
  cursorRing.style.top = `${e.clientY}px`;

  pointerX = (e.clientX / window.innerWidth) * 2 - 1;
  pointerY = -(e.clientY / window.innerHeight) * 2 + 1;

  uniforms.uMouse3D.value.set(pointerX * 2.2, pointerY * 2.2, 1.5);
  particleMat.uniforms.uAttractor.value.set(pointerX * 4.0, pointerY * 3.0, 1.0);

  if (audioEnabled && synthFilter && audioCtx) {
    const freq = 180 + ((e.clientX / window.innerWidth) * 650);
    synthFilter.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.08);
  }

  if (!activePointers.has(e.pointerId)) return;
  const prev = activePointers.get(e.pointerId);

  if (activePointers.size === 1) {
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    const sens = isMobile ? 0.009 : 0.0065;
    targetRotY += dx * sens;
    targetRotX += dy * sens;
    targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, targetRotX));
  } else if (activePointers.size === 2) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(activePointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (initialPinchDist && initialPinchDist > 10) {
      const ratio = initialPinchDist / dist;
      targetPinchZoom = Math.max(0.55, Math.min(1.7, initialPinchZoom * ratio));
    }
    return;
  }

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
});

function clearPointer(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) initialPinchDist = null;
  if (activePointers.size === 0) cursorRing.classList.remove('active');
}

window.addEventListener('pointerup', clearPointer);
window.addEventListener('pointercancel', clearPointer);

// Mouse Wheel Chapter Switching
let wheelCooldown = false;
window.addEventListener('wheel', (e) => {
  if (e.target.closest('#studio-panel')) return;
  if (wheelCooldown || Math.abs(e.deltaY) < 25) return;
  wheelCooldown = true;
  const dir = e.deltaY > 0 ? 1 : -1;
  setChapter((currentChapter + dir + CFG.chapters.length) % CFG.chapters.length);
  setTimeout(() => { wheelCooldown = false; }, 650);
}, { passive: true });

function setChapter(index) {
  currentChapter = index;
  targetPinchZoom = 1.0;
  const ch = CFG.chapters[index];
  syncChapterTargets();

  document.getElementById('chapter-badge').textContent = ch.badge;
  document.getElementById('hero-title').textContent = ch.title;
  document.getElementById('hero-desc').textContent = ch.desc;

  document.querySelectorAll('.chapter-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });
}

document.querySelectorAll('.chapter-btn').forEach((btn) => {
  btn.addEventListener('click', () => setChapter(parseInt(btn.dataset.chapter, 10)));
});

// ============================================================================
// 5. MOBILE GYROSCOPE TILT SENSOR
// ============================================================================
let tiltEnabled = false;
let tiltX = 0, tiltY = 0;
const tiltBtn = document.getElementById('tilt-btn');

function handleOrientation(e) {
  if (!tiltEnabled) return;
  const gamma = THREE.MathUtils.clamp(e.gamma || 0, -45, 45) / 45;
  const beta = THREE.MathUtils.clamp((e.beta || 45) - 45, -45, 45) / 45;
  tiltX = gamma;
  tiltY = -beta;
  uniforms.uMouse3D.value.set(tiltX * 2.2, tiltY * 2.2, 1.5);
}

tiltBtn.addEventListener('click', async () => {
  if (!tiltEnabled) {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return;
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    tiltEnabled = true;
    tiltBtn.classList.add('active');
  } else {
    window.removeEventListener('deviceorientation', handleOrientation, true);
    tiltEnabled = false;
    tiltX = 0;
    tiltY = 0;
    tiltBtn.classList.remove('active');
  }
});

// ============================================================================
// 6. STUDIO DRAWER, THEMES, SLIDERS, WARP & SNAPSHOT EXPORT
// ============================================================================
const studioPanel = document.getElementById('studio-panel');
document.getElementById('open-studio-btn').addEventListener('click', () => {
  studioPanel.classList.add('drawer-open');
});
document.getElementById('close-studio-btn').addEventListener('click', () => {
  studioPanel.classList.remove('drawer-open');
});

const geoNames = {
  sphere: 'Harmonic Sphere',
  torusknot: 'Quantum Knot',
  starburst: 'Cyber Starknot',
  torus: 'Hyper-Torus',
  icosa: 'Crystal Geode',
  octa: 'Astral Octa'
};

document.querySelectorAll('#geo-grid .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.geo;
    coreMesh.geometry = geometries[key];
    wireframeMesh.geometry = geometries[key];
    document.getElementById('geo-label').textContent = geoNames[key];
    document.querySelectorAll('#geo-grid .chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    triggerPulseWave();
  });
});

function applyTheme(idx) {
  const t = CFG.themes[idx];
  targetColorA.set(t.colorA);
  targetColorB.set(t.colorB);
  targetColorC.set(t.colorC);

  particleMat.uniforms.uColorB.value.set(t.colorB);
  particleMat.uniforms.uColorC.value.set(t.colorC);
  haloUniforms.uColorB.value.set(t.colorB);
  haloUniforms.uColorC.value.set(t.colorC);

  wireframeMaterial.color.set(t.accentHex);
  ringMat1.color.set(t.accentHex);
  ringMat2.color.set(t.accent2Hex);
  satMat.emissive.set(t.accentHex);

  document.documentElement.style.setProperty('--accent', t.accent2Hex);
  document.documentElement.style.setProperty('--accent-2', t.accentHex);
  document.getElementById('theme-label').textContent = t.name;
  document.getElementById('mobile-theme-indicator').textContent = t.short;

  document.querySelectorAll('#theme-grid .chip-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

document.querySelectorAll('#theme-grid .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => applyTheme(parseInt(btn.dataset.theme, 10)));
});

// Sliders
let timeSpeed = 0.90;
const sliderMorph = document.getElementById('slider-morph');
const sliderFreq = document.getElementById('slider-freq');
const sliderBloom = document.getElementById('slider-bloom');
const sliderGlow = document.getElementById('slider-glow');
const sliderSpeed = document.getElementById('slider-speed');

sliderMorph.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  uniforms.uMorphStrength.value = v;
  document.getElementById('val-morph').textContent = v.toFixed(2);
});

sliderFreq.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  uniforms.uFrequency.value = v;
  document.getElementById('val-freq').textContent = v.toFixed(2);
});

sliderBloom.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  bloomPass.strength = v;
  document.getElementById('val-bloom').textContent = v.toFixed(2);
});

sliderGlow.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  uniforms.uGlow.value = v;
  document.getElementById('val-glow').textContent = v.toFixed(2);
});

sliderSpeed.addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  timeSpeed = v;
  document.getElementById('val-speed').textContent = `${v.toFixed(2)}x`;
});

// Shockwave Pulse
function triggerPulseWave() {
  uniforms.uPulse.value = 1.45;
  haloUniforms.uPulse.value = 1.2;

  if (audioEnabled && audioCtx) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(48, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  }
}

document.getElementById('pulse-btn').addEventListener('click', triggerPulseWave);

// Randomize DNA
document.getElementById('randomize-btn').addEventListener('click', () => {
  const geoKeys = Object.keys(geometries);
  const randomGeo = geoKeys[Math.floor(Math.random() * geoKeys.length)];
  document.querySelector(`[data-geo="${randomGeo}"]`).click();

  applyTheme(Math.floor(Math.random() * CFG.themes.length));

  const m = (0.2 + Math.random() * 0.75).toFixed(2);
  const f = (0.7 + Math.random() * 2.5).toFixed(2);
  const b = (0.55 + Math.random() * 1.1).toFixed(2);

  sliderMorph.value = m;
  uniforms.uMorphStrength.value = parseFloat(m);
  document.getElementById('val-morph').textContent = m;

  sliderFreq.value = f;
  uniforms.uFrequency.value = parseFloat(f);
  document.getElementById('val-freq').textContent = f;

  sliderBloom.value = b;
  bloomPass.strength = parseFloat(b);
  document.getElementById('val-bloom').textContent = b;

  triggerPulseWave();
});

// Top Bar Toggles: Warp, Wireframe, Snapshot, Cinema
let warpActive = false;
const warpBtn = document.getElementById('warp-btn');
warpBtn.addEventListener('click', () => {
  warpActive = !warpActive;
  warpBtn.classList.toggle('active', warpActive);
  triggerPulseWave();
});

let wireframeActive = false;
const wireframeBtn = document.getElementById('wireframe-btn');
wireframeBtn.addEventListener('click', () => {
  wireframeActive = !wireframeActive;
  wireframeBtn.classList.toggle('active', wireframeActive);
});

document.getElementById('snap-btn').addEventListener('click', () => {
  composer.render();
  con
