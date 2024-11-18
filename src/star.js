import * as THREE from 'three';

// Shared TextureLoader instance for caching
const sharedTextureLoader = new THREE.TextureLoader();

// Utility function to generate an array of random colors
function generateRandomColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(new THREE.Color(Math.random(), Math.random(), Math.random()));
  }
  return colors;
}

export function createPlaneWithParticles(
  modelPath,
  planeSize,
  planeColor,
  planeScale = 1,
  sphereScale = 1,
  emissionBrightness = 3,
  textureLoader = sharedTextureLoader // Default to shared loader
) {
  const group = new THREE.Group();

  // Load point texture using the provided texture loader
  const pointTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/circle.png');

  // Generate 4 random emissive colors
  const emissiveColors = generateRandomColors(4);

  // Select one emissive color randomly from the four
  const selectedEmissiveColor = emissiveColors[Math.floor(Math.random() * emissiveColors.length)];

  // Plane Material
  const planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(planeColor) }, // Base color
      uBrightness: { value: emissionBrightness }, // Brightness multiplier
      uEmissiveColor: { value: selectedEmissiveColor }, // Selected emissive color
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv; // Pass UV coordinates to the fragment shader
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uBrightness;
      uniform vec3 uEmissiveColor;
      varying vec2 vUv;

      void main() {
        // Calculate distance from the center
        float dist = distance(vUv, vec2(0.5));

        // Emissive intensity based on distance
        float intensity = smoothstep(0.0, 0.5, 0.5 - dist) * uBrightness;

        // Apply the selected emissive color
        vec3 emissive = uEmissiveColor * intensity;

        // Alpha for smooth transparency at edges
        float alpha = smoothstep(0.5, 0.48, 0.5 - dist);

        // Discard fully transparent pixels
        if (alpha <= 0.01) discard;

        // Set color with emissive effect and alpha
        gl_FragColor = vec4(uColor * intensity + emissive, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Plane Geometry
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.scale.set(planeScale, planeScale, 1);
  group.add(plane);

  // Declare sphereRadius based on planeSize and sphereScale
  const sphereRadius = (planeSize / 2) * sphereScale;

  // Particles in a sphere
  const particleCount = 500; // Adjust particle count as needed
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Generate random spherical coordinates
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = sphereRadius * Math.cbrt(Math.random()); // Adjust distribution

    // Convert spherical to Cartesian coordinates
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    sizes[i] = Math.random() * 3.0 + 1.5; // Random particle sizes
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Particle Material
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: pointTexture },
      uEmissiveColor: { value: selectedEmissiveColor }, // Shared emissive color
    },
    vertexShader: `
      attribute float size;
      uniform vec3 uEmissiveColor;
      varying vec3 vEmissive;

      void main() {
        vEmissive = uEmissiveColor; // Pass emissive color to fragment shader
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vEmissive;

      void main() {
        vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
        if (textureColor.a < 0.5) discard; // Discard transparent parts of the texture
        gl_FragColor = vec4(vEmissive, textureColor.a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  return group;
}
