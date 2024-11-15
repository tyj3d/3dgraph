// createSimpleScene.js
import * as THREE from 'three';

// Function to create a simple scene with a cube
export function createStar() {
  // Create a scene
  const scene = new THREE.Scene();

  // Create a cube geometry
  const geometry = new THREE.BoxGeometry(3, 3, 3); 
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Green color
  const cube = new THREE.Mesh(geometry, material); // Combine geometry and material into a mesh

  // Add the cube to the scene
  scene.add(cube);

  // Return the scene
  return scene;
}
