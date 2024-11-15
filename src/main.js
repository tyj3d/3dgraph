import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';
// import { createPlaneWithBloom } from './star.js';
// import { createParticles } from './star.js';
import { createPlaneWithParticles } from './star.js'
const sizes = { width: window.innerWidth, height: window.innerHeight };
// Define the path to the GLTF/GLB model
const modelPath = './static/starmodels3.glb';
// Define plane properties
const planeSize = 30;
const planeColor = 0xffffff; // White plane

// Create the 3D force graph
const Graph = ForceGraph3D()(document.getElementById('graph-container'))
  .nodeThreeObject(node => {
    // Use createPlaneWithBloom for node representation
    // const plane = createPlaneWithBloom(30, 0xFFFFFF); // White plane
    // plane.userData.nodeId = node.id; // Store node id for debugging or tracking
    // const plane = createPlaneWithParticles(scene, sizes, modelPath, planeSize, planeColor); // White plane
   
    // return plane;
    createPlaneWithParticles(scene, { width: window.innerWidth, height: window.innerHeight }, '/static/starmodels3.glb', 30, 0xff0000)
    .then((group) => {
        console.log('Combined group added to the scene:', group);
    })
    .catch((error) => {
        console.error('Error adding group:', error);
    });


  })
  .linkWidth(2)
  .linkColor('#aaa');

// Adjust the link distance
Graph.d3Force('link').distance(200); // Correct usage of d3Force

// // Load miserables.json
// fetch('./datasets/miserables.json') // Adjust path as needed
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to load miserables.json: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     // Set graph data
//     Graph.graphData(data);
//   })
//   .catch(error => {
//     console.error('Error loading miserables.json:', error);
//   });


const dummyData = {
  nodes: [
    { id: 1, x: 10, y: 20, z: 30 },
    { id: 2, x: -15, y: 25, z: -35 },
    { id: 3, x: 40, y: -10, z: 50 },
    { id: 4, x: -30, y: -40, z: 20 },
    { id: 5, x: 5, y: 15, z: 25 },
    { id: 6, x: -20, y: -10, z: -5 },
    { id: 7, x: 35, y: 45, z: 55 },
    { id: 8, x: -25, y: 30, z: -15 },
    { id: 9, x: 50, y: -35, z: 10 },
    { id: 10, x: 0, y: 0, z: 0 },
  ],
  links: [
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 3, target: 4 },
    { source: 4, target: 5 },
    { source: 5, target: 6 },
    { source: 6, target: 7 },
    { source: 7, target: 8 },
    { source: 8, target: 9 },
    { source: 9, target: 10 },
    { source: 10, target: 1 },
  ],
};
Graph.graphData(dummyData);

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
