import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import { createPlaneWithParticles } from '/src/star.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const sizes = { width: window.innerWidth, height: window.innerHeight };

// Create the 3D force graph
const Graph = ForceGraph3D()(document.getElementById('graph-container'))
  .nodeThreeObject(node => {
    const lod = new THREE.LOD();

    // Add detailed geometry (e.g., plane with particles)
    const highDetail = createPlaneWithParticles('./static/starmodels3.glb', 30, 0xffffff);
    highDetail.userData.nodeId = node.id;
    lod.addLevel(highDetail, 500); // Full detail at distance 0

    // Add medium-detail geometry
    const mediumDetailGeometry = new THREE.PlaneGeometry(20, 20);
    const mediumDetailMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const mediumDetail = new THREE.Mesh(mediumDetailGeometry, mediumDetailMaterial);
    lod.addLevel(mediumDetail, 1400); // Medium detail at distance 100

    // Add low-detail geometry
    const lowDetailGeometry = new THREE.SphereGeometry(5, 8, 8); // Very simple sphere
    const lowDetailMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lowDetail = new THREE.Mesh(lowDetailGeometry, lowDetailMaterial);
    lod.addLevel(lowDetail, 1401); // Low detail at distance 300

    return lod;
  })
  .linkWidth(2)
  .linkColor('#aaa');

// Configure camera controls
const controls = Graph.controls();

// Limit camera rotation speed
controls.rotateSpeed = 0.5; // Lower this to reduce rotation speed
controls.zoomSpeed = 0.5; // Lower this to reduce zoom speed

// Enable smooth damping and disable edge acceleration
controls.enableDamping = true; // Smooth camera motion
controls.dampingFactor = 2.5; // Adjust for slower damping
controls.screenSpacePanning = false; // Disable panning behavior

// Adjust the link distance
Graph.d3Force('link').distance(200);
Graph.linkWidth(1); // Reduce link width
// Fetch miserables.json and set it as the graph data
fetch('/datasets/miserables.json') // Ensure the file is in the correct path
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load miserables.json: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    // Set the graph data
    Graph.graphData(data);
  })
  .catch(error => {
    console.error('Error loading miserables.json:', error);
  });

// Rest of your code...


// Access the scene (created by ForceGraph3D)
const scene = Graph.scene();

// Adjust camera
const camera = Graph.camera();
camera.position.set(400, 150, 150);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Adjust the camera near and far planes
camera.near = 1; // Increase near plane
camera.far = 700; // Decrease far plane
camera.updateProjectionMatrix(); // Ensure the changes take effect

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 0.5);
spotLight.position.set(0, 100, 100);
scene.add(spotLight);

// Add environment sphere with HDRI
function addEnvironmentSphere(hdriPath, brightness = 1) {
  const sphereGeometry = new THREE.SphereGeometry(5000, 64, 64); // Large sphere for environment
  const hdrLoader = new RGBELoader();

  hdrLoader.load(hdriPath, texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uBrightness: { value: brightness },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uBrightness;
        varying vec2 vUv;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);
          gl_FragColor = vec4(texColor.rgb * uBrightness, texColor.a);
        }
      `,
      side: THREE.BackSide, // Render the inside of the sphere
      transparent: false,
    });

    const environmentSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(environmentSphere);
  });
}

// Add the HDRI environment sphere
addEnvironmentSphere('./static/spaceStarsE2.hdr', 5.0); // Replace with your HDRI path

// Ensure renderer settings
const renderer = Graph.renderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Add EffectComposer and BloomPass
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // Intensity
  0.4, // Radius
  0.85 // Threshold
);
bloomPass.threshold = 0.1; // Increase to reduce bloom areas
bloomPass.strength = 0.03; // Reduce strength
bloomPass.radius = 0.5; // Smaller radius for performance
composer.setSize(window.innerWidth / 4, window.innerHeight / 4); // Lower resolution

// Add resize listener to adjust the scene
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update sizes
  sizes.width = width;
  sizes.height = height;

  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer and composer
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(width, height);
});

// Add a render loop to make planes face the camera
function animate() {
  requestAnimationFrame(animate);

  // Make all planes face the camera
  scene.traverse(object => {
    if (object.isMesh && object.geometry.type === 'PlaneGeometry') {
      object.lookAt(camera.position); // Orient the plane to face the camera
    }
  });

  // Render the scene with bloom
  composer.render();
}
animate();
