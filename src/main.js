// src/main.js
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import { createPlaneWithBloom } from './star.js';
import { createParticles } from './star.js';

// Sample graph data (nodes and links)
const graphData = {
  nodes: [
    { id: 1, name: "Node 1" },
    { id: 2, name: "Node 2" },
    { id: 3, name: "Node 3" },
    { id: 4, name: "Node 4" },
  ],
  links: [
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 3, target: 4 },
    { source: 4, target: 1 },
  ],
};

// Create the 3D force graph
const Graph = ForceGraph3D()(document.getElementById('graph-container'))
  .graphData(graphData) // Apply graph data (nodes and links)
  .nodeThreeObject(node => {
    // Replace default node sphere with a star from createStar
    return createParticles(10, 0xff0000); // Red star nodes (adjust the size as needed)
  })
  .linkWidth(2) // Link width
  .linkColor('#aaa') // Link color
  .nodeColor('red'); // Node color (not visible because we are using custom star geometry)

// Set up the default camera and lights manually

// Access the scene (created by ForceGraph3D)
const scene = Graph.scene();

// Default camera (3D perspective view)
const camera = Graph.camera(); // This is automatically provided by ForceGraph3D, but we can adjust it

// Adjust camera position if needed
camera.position.set(100, 0, 0); // Example position, adjust as needed
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Make sure the camera is looking at the center of the scene

// Add a basic ambient light (soft overall light)
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Ambient light with intensity 1
scene.add(ambientLight);

// Add a directional light (like sunlight) for better lighting effects
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
directionalLight.position.set(100, 100, 100); // Position the light
scene.add(directionalLight);

// Add a spotlight (optional for more focused lighting)
const spotLight = new THREE.SpotLight(0xffffff, 1); // Spotlight with intensity 1
spotLight.position.set(0, 100, 100); // Adjust the spotlight position
scene.add(spotLight);

// Optional: You can add more lights like point lights or more spotlights if necessary

// Start the graph and the lights are already in place
