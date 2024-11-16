import * as THREE from '/three';

export function createPlaneWithParticles(modelPath, planeSize, planeColor = 0xffffff, planeScale = 1, sphereScale = 1, emissionBrightness = 3) {
  const group = new THREE.Group();

const planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(planeColor = 0xffffff) }, // Emissive color
      uBrightness: { value: emissionBrightness }, // Brightness multiplier
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
      varying vec2 vUv;
  
      void main() {
        // Calculate distance from the center
        float dist = distance(vUv, vec2(0.5));
  
        // Emissive intensity based on distance
        float intensity = smoothstep(0.0, 0.5, 0.5 - dist) * uBrightness;
  
        // Alpha for smooth transparency at edges
        float alpha = smoothstep(0.5, 0.48, 0.5 - dist);
  
        // Discard fully transparent pixels
        if (alpha <= 0.01) discard;
  
        // Set color with emissive effect and alpha
        gl_FragColor = vec4(uColor * intensity, alpha);
      }
    `,
    transparent: true, // Enable transparency
    blending: THREE.AdditiveBlending, // Additive blending for smooth glow effect
    depthWrite: false, // Prevent writing to the depth buffer
  });
  
  
  

  // Plane
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);

  // Apply the scale to the plane only
  plane.scale.set(planeScale, planeScale, 1);
  group.add(plane);

  // Particles in a sphere
  const particleCount = 1000; // Increase for more dense appearance
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount); // Store individual particle sizes

  const sphereRadius = (planeSize / 2) * sphereScale; // Scales the sphere size

  for (let i = 0; i < particleCount; i++) {
    // Random spherical coordinates
    const theta = Math.random() * 2 * Math.PI; // Angle around the Z-axis
    const phi = Math.acos(2 * Math.random() - 1); // Angle from the Y-axis
    const r = sphereRadius * Math.cbrt(Math.random()); // Random radius for even distribution

    // Convert spherical to Cartesian coordinates
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Randomize the size of each particle
    sizes[i] = Math.random() * 3.0 + 1.5; // Particle size between 0.5 and 2.5
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Store sizes

  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/circle.png') },
    },
    vertexShader: `
      attribute float size;
      varying float vSize;

      void main() {
          vSize = size; // Pass size to fragment shader

          // Compute model-view position
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Use mvPosition to calculate perspective-correct point size
          gl_PointSize = size * (300.0 / -mvPosition.z);

          // Compute the final clip-space position
          gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying float vSize;

      void main() {
          vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
          if (textureColor.a < 0.5) discard; // Discard transparent parts of the texture
          gl_FragColor = textureColor;
      }
    `,
    transparent: true,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  console.log(`Group created with plane scale: ${planeScale}`, group); // Debugging

  return group; // Synchronously return the group
}
