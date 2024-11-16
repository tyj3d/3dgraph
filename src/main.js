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
    const planeWithParticles = createPlaneWithParticles('./static/starmodels3.glb', 30, 0xff0000);
    planeWithParticles.userData.nodeId = node.id; // Store node id for debugging or tracking
    return planeWithParticles;
  })
  .linkWidth(2)
  .linkColor('#aaa');

// Adjust the link distance
Graph.d3Force('link').distance(200);

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

// Access the scene (created by ForceGraph3D)
const scene = Graph.scene();

// Adjust camera
const camera = Graph.camera();
camera.position.set(150, 150, 150);
camera.lookAt(new THREE.Vector3(0, 0, 0));

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
addEnvironmentSphere('./static/spaceStarsE.hdr', 1.5); // Replace with your HDRI path

// Ensure renderer settings
const renderer = Graph.renderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Add EffectComposer and BloomPass
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.07; // Adjust threshold for bloom
bloomPass.strength = 0.1; // Adjust intensity of bloom
bloomPass.radius = 0.8; // Adjust spread of bloom
composer.addPass(bloomPass);

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
