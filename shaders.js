// ============================================================================
// AETHERIA PRO — CUSTOM GLSL SHADERS, PALETTES & CAMERA CHAPTERS
// ============================================================================

window.AETHERIA_CONFIG = {
  // 1. CORE 3D SIMPLEX NOISE + FINITE-DIFFERENCE NORMAL VERTEX SHADER
  coreVertexShader: `
    uniform float uTime;
    uniform float uMorphStrength;
    uniform float uFrequency;
    uniform float uPulse;
    uniform float uBeat;
    uniform vec3 uMouse3D;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vNoise;

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 1.0/7.0;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float getDisplacement(vec3 pos, float freq, float t) {
      float n1 = snoise(pos * freq + vec3(t * 0.45));
      float n2 = 0.5 * snoise(pos * (freq * 2.15) - vec3(t * 0.72));
      float n3 = 0.25 * snoise(pos * (freq * 4.0) + vec3(0.0, t * 1.1, 0.0));
      return n1 + n2 + n3;
    }

    void main() {
      vPosition = position;

      float activeMorph = uMorphStrength * (1.0 + uBeat * 0.35);
      float combinedNoise = getDisplacement(position, uFrequency, uTime);

      // 3D Touch / Cursor gravitational ripple
      float mouseDist = distance(position, uMouse3D);
      float mouseRipple = sin(mouseDist * 5.5 - uTime * 4.5) * exp(-mouseDist * 1.1) * 0.26;

      // Shockwave pulse
      float shockwave = sin(length(position) * 9.0 - uTime * 11.0) * uPulse * 0.38;

      float totalDisplacement = (combinedNoise * activeMorph) + mouseRipple + shockwave;
      vNoise = combinedNoise;

      vec3 displacedPosition = position + normal * totalDisplacement;

      // Finite-difference normal recalculation for liquid-metal specular accuracy
      float eps = 0.022;
      vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
      vec3 bitangent = normalize(cross(normal, tangent));
      vec3 neighbour1 = position + tangent * eps;
      vec3 neighbour2 = position + bitangent * eps;

      float d1 = getDisplacement(neighbour1, uFrequency, uTime) * activeMorph;
      float d2 = getDisplacement(neighbour2, uFrequency, uTime) * activeMorph;

      vec3 displacedN1 = neighbour1 + normal * d1;
      vec3 displacedN2 = neighbour2 + normal * d2;
      vec3 perturbedNormal = normalize(cross(displacedN1 - displacedPosition, displacedN2 - displacedPosition));

      vNormal = normalize(normalMatrix * mix(normal, perturbedNormal, 0.7));

      vec4 worldPos = modelMatrix * vec4(displacedPosition, 1.0);
      vWorldPosition = worldPos.xyz;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  // 2. CORE IRIDESCENT FRESNEL + COSINE PALETTE FRAGMENT SHADER
  coreFragmentShader: `
    uniform float uTime;
    uniform float uGlow;
    uniform float uPulse;
    uniform float uBeat;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vNoise;

    vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.28318 * (c * t + d));
    }

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 norm = normalize(vNormal);

      float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 2.5);

      vec3 lightDir1 = normalize(vec3(4.0, 6.0, 5.0));
      vec3 lightDir2 = normalize(vec3(-5.0, -4.0, 3.0));

      float diff1 = max(dot(norm, lightDir1), 0.0);
      float diff2 = max(dot(norm, lightDir2), 0.0);

      vec3 halfVec1 = normalize(lightDir1 + viewDir);
      float spec1 = pow(max(dot(norm, halfVec1), 0.0), 72.0);

      float colorIndex = vNoise * 0.48 + fresnel * 0.8 + uTime * 0.07;
      vec3 iridColor = cosinePalette(
        colorIndex,
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(1.0, 1.0, 1.0),
        vec3(0.00, 0.15, 0.25)
      );

      vec3 baseGradient = mix(uColorA, uColorB, smoothstep(-0.75, 0.85, vNoise));
      vec3 coreColor = mix(baseGradient, iridColor * uColorC, 0.48);

      // HDR Emissive values (> 1.0) feed directly into the UnrealBloomPass
      vec3 finalColor = coreColor * (0.3 + diff1 * 0.7 + diff2 * 0.28);
      finalColor += uColorC * fresnel * uGlow * (1.0 + uBeat * 0.45);
      finalColor += vec3(1.0, 0.98, 1.0) * spec1 * 1.15;
      finalColor += uColorB * uPulse * 0.65;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,

  // 3. SWIRLING PLASMA ACCRETION HALO SHADER
  haloVertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  haloFragmentShader: `
    uniform float uTime;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uPulse;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float r = length(centered) * 2.0;
      float angle = atan(centered.y, centered.x);

      // Soft annular ring mask
      float ringMask = smoothstep(0.52, 0.68, r) * (1.0 - smoothstep(0.78, 0.98, r));

      // Swirling plasma filaments
      float swirl1 = sin(angle * 8.0 - uTime * 2.4 + r * 14.0);
      float swirl2 = cos(angle * 13.0 + uTime * 1.8 - r * 18.0);
      float plasma = (swirl1 * swirl2) * 0.5 + 0.5;

      vec3 col = mix(uColorB, uColorC, plasma);
      float alpha = ringMask * (0.18 + plasma * 0.38 + uPulse * 0.25);

      gl_FragColor = vec4(col * 1.4, alpha);
    }
  `,

  // 4. INTERACTIVE GRAVITY & WARP PARTICLE SHADERS
  particleVertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uWarp;
    uniform vec3 uAttractor;
    attribute float aScale;
    attribute float aSpeed;
    varying float vAlpha;
    varying float vMix;

    void main() {
      vec3 pos = position;

      // Orbital rotation
      float angle = uTime * 0.05 * aSpeed;
      float s = sin(angle);
      float c = cos(angle);
      pos.xz = mat2(c, -s, s, c) * pos.xz;
      pos.y += sin(uTime * 0.7 + aScale * 15.0) * 0.15;

      // Subtle gravitational pull toward user's 3D touch/mouse attractor
      vec3 toAttractor = uAttractor - pos;
      float distToAttractor = length(toAttractor);
      float pull = exp(-distToAttractor * 0.35) * 0.65;
      pos += normalize(toAttractor + vec3(0.0001)) * pull;

      // Hyperdrive Z-axis tunnel stream when Warp is active
      if (uWarp > 0.01) {
        pos.z = mod(pos.z + uTime * 18.0 * uWarp + 15.0, 30.0) - 15.0;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float warpSizeBoost = 1.0 + uWarp * 1.6;
      gl_PointSize = (15.0 * aScale + 4.0) * warpSizeBoost * uPixelRatio * (1.0 / -mvPosition.z);
      vAlpha = 0.25 + 0.7 * aScale;
      vMix = aScale;
    }
  `,

  particleFragmentShader: `
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying float vAlpha;
    varying float vMix;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float strength = pow(1.0 - dist * 2.0, 2.2);
      vec3 col = mix(uColorB, uColorC, vMix) * 1.5;
      gl_FragColor = vec4(col, strength * vAlpha);
    }
  `,

  // 5. 6 CURATED CHROMATIC THEMES
  themes: [
    {
      name: 'Cyberpunk Nebula',
      short: 'Nebula',
      colorA: '#160d3d',
      colorB: '#7c5cff',
      colorC: '#00f0ff',
      accentHex: '#00f0ff',
      accent2Hex: '#7c5cff'
    },
    {
      name: 'Solaris Supernova',
      short: 'Solaris',
      colorA: '#2b0614',
      colorB: '#ff1e56',
      colorC: '#ffaa00',
      accentHex: '#ffaa00',
      accent2Hex: '#ff1e56'
    },
    {
      name: 'Abyssal Biolume',
      short: 'Biolume',
      colorA: '#042224',
      colorB: '#00b8ff',
      colorC: '#00ff9d',
      accentHex: '#00ff9d',
      accent2Hex: '#00b8ff'
    },
    {
      name: 'Obsidian Chrome',
      short: 'Chrome',
      colorA: '#0a0c14',
      colorB: '#6b7cff',
      colorC: '#ffffff',
      accentHex: '#ffffff',
      accent2Hex: '#6b7cff'
    },
    {
      name: 'Crimson Eclipse',
      short: 'Eclipse',
      colorA: '#1f040a',
      colorB: '#ff2a54',
      colorC: '#ff9a00',
      accentHex: '#ff2a54',
      accent2Hex: '#ff9a00'
    },
    {
      name: 'Aurora Borealis',
      short: 'Aurora',
      colorA: '#071e22',
      colorB: '#38ef7d',
      colorC: '#a8ff78',
      accentHex: '#38ef7d',
      accent2Hex: '#00d2ff'
    }
  ],

  // 6. 5 SPATIAL CAMERA CHAPTERS
  chapters: [
    {
      badge: 'CHAPTER 01 // SINGULARITY CORE',
      title: 'HYPER-DIMENSIONAL SHADER ENGINE.',
      desc: 'Drag with 1 finger to orbit, pinch with 2 fingers to zoom, or double-tap to fire a gravitational shockwave. Real-time HDR Unreal Bloom meets 3D Simplex displacement.',
      camPos: [0, 0.25, 6.2],
      desktopOffset: [0.25, 0, 0],
      mobileOffset: [0, 0.55, 0]
    },
    {
      badge: 'CHAPTER 02 // EVENT HORIZON',
      title: 'RELATIVISTIC PLASMA REFRACTION.',
      desc: 'Swirling accretion filaments and Fresnel chromatic dispersion bend light around the morphing geometry in real time.',
      camPos: [-2.6, 1.55, 4.9],
      desktopOffset: [0.5, -0.08, 0],
      mobileOffset: [0, 0.45, 0]
    },
    {
      badge: 'CHAPTER 03 // ACCRETION RING',
      title: 'ORBITAL MONOLITH LATTICE.',
      desc: 'Fourteen crystalline satellites and dual gyroscopic rings lock into harmonic resonance around the central singularity.',
      camPos: [2.7, -1.3, 5.4],
      desktopOffset: [0.0, 0.15, 0],
      mobileOffset: [0, 0.5, 0]
    },
    {
      badge: 'CHAPTER 04 // POLAR ZENITH',
      title: 'VORTEX TOPOLOGY VIEW.',
      desc: 'Looking straight down the polar axis of the accretion disk as 6,000 interactive particles spiral toward your touch point.',
      camPos: [0.0, 4.6, 3.4],
      desktopOffset: [0.0, 0.0, 0],
      mobileOffset: [0, 0.25, 0]
    },
    {
      badge: 'CHAPTER 05 // MACRO IMMERSION',
      title: 'SUB-SURFACE SHADER MATRIX.',
      desc: 'Extreme close-up of the finite-difference normal perturbation mesh. Open the Studio Drawer to sculpt the frequencies live.',
      camPos: [0.08, 0.0, 3.35],
      desktopOffset: [0.0, 0.0, 0],
      mobileOffset: [0, 0.3, 0]
    }
  ]
};
