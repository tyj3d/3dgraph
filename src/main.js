import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
import { createPlaneWithBloom } from './star.js';

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
  .graphData(graphData)
  .nodeThreeObject(node => {
    // Use createPlaneWithBloom for node representation
    return createPlaneWithBloom(10, 0xff0000); // Red star nodes
  })
  .linkWidth(2)
  .linkColor('#aaa');

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
