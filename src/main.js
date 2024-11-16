import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import { createPlaneWithParticles } from './star.js';

const sizes = { width: window.innerWidth, height: window.innerHeight };

// Create the 3D force graph
const Graph = ForceGraph3D()(document.getElementById('graph-container'))
  .nodeThreeObject(node => {
    const planeWithParticles = createPlaneWithParticles('/static/starmodels3.glb', 30, 0xff0000);
    planeWithParticles.userData.nodeId = node.id; // Store node id for debugging or tracking
    return planeWithParticles;
  })
  .linkWidth(2)
  .linkColor('#aaa');

// Adjust the link distance
Graph.d3Force('link').distance(200);

// Fetch miserables.json and set it as the graph data
fetch('./datasets/miserables.json') // Ensure the file is in the correct path
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

// Ensure renderer settings
Graph.renderer().setPixelRatio(window.devicePixelRatio);

// Add a render loop to make planes face the camera
function animate() {
  requestAnimationFrame(animate);

  // Make all planes face the camera
  scene.traverse(object => {
    if (object.isMesh && object.geometry.type === 'PlaneGeometry') {
      object.lookAt(camera.position); // Orient the plane to face the camera
    }
  });

  Graph.renderer().render(scene, camera); // Render the scene
}
animate();
