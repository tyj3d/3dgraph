import * as THREE from 'three';

export function createPlaneWithParticles(modelPath, planeSize, planeColor, planeScale = 0.5, sphereScale = 2) {
  const group = new THREE.Group();

  // Plane
  const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
  const planeMaterial = new THREE.MeshBasicMaterial({ color: planeColor });
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
    sizes[i] = Math.random() * 4 + 2; // Particle size between 0.5 and 2.5
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

  console.log(`Group created with sphere scale: ${sphereScale}`, group); // Debugging

  return group; // Synchronously return the group
}
