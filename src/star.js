// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// /**
//  * Function to create a plane with emissive bloom effect.
//  */
// export function createPlaneWithBloom(size = 10, color = 0xffffff) {
//     console.log(`Creating a plane with size: ${size} and color: ${color.toString(16)}`);

//     const planeGeometry = new THREE.PlaneGeometry(size, size);
//     const planeMaterial = new THREE.ShaderMaterial({
//         uniforms: {
//             color: { value: new THREE.Color(color) },
//             opacity: { value: 0.9 },
//             emissiveColor: { value: new THREE.Color(color) },
//             emissiveIntensity: { value: 1.0 },
//         },
//         vertexShader: `
//             varying vec2 vUv;
//             void main() {
//                 vUv = uv;
//                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//             }
//         `,
//         fragmentShader: `
//             uniform vec3 color;
//             uniform float opacity;
//             uniform vec3 emissiveColor;
//             uniform float emissiveIntensity;
//             varying vec2 vUv;

//             void main() {
//                 float distanceFromCenter = distance(vUv, vec2(0.5, 0.5));
//                 float falloff = smoothstep(0.0, 0.5, distanceFromCenter);
//                 vec3 emissive = emissiveColor * emissiveIntensity * (1.0 - falloff);
//                 vec3 finalColor = color + emissive;
//                 gl_FragColor = vec4(finalColor, opacity * (1.0 - falloff));
//             }
//         `,
//         transparent: true,
//         blending: THREE.AdditiveBlending,
//         depthWrite: false,
//     });

//     return new THREE.Mesh(planeGeometry, planeMaterial);
// }

// /**
//  * Function to setup particles and add them to the scene.
//  */
// export function createParticles(scene, sizes, modelPath) {
//     return new Promise((resolve, reject) => {
//         const gltfLoader = new GLTFLoader();
//         const dracoLoader = new DRACOLoader();

//         dracoLoader.setDecoderPath('/draco/');
//         gltfLoader.setDRACOLoader(dracoLoader);

//         gltfLoader.load(
//             modelPath,
//             (gltf) => {
//                 console.log('GLTF model loaded successfully:', gltf);
//                 const particles = createParticlesFromGLTF(gltf, sizes);
//                 scene.add(particles);
//                 dracoLoader.dispose();
//                 resolve(particles);
//             },
//             undefined,
//             (error) => {
//                 console.error('Error loading GLTF model:', error);
//                 reject(error);
//             }
//         );
//     });
// }

// /**
//  * Helper function to create particles from GLTF model.
//  */
// function createParticlesFromGLTF(gltf, sizes) {
//     const positions = [];
//     gltf.scene.traverse((child) => {
//         if (child.geometry && child.geometry.attributes.position) {
//             positions.push(child.geometry.attributes.position.array);
//         }
//     });

//     if (positions.length === 0) {
//         throw new Error('No valid geometry with position attribute found in the GLTF model.');
//     }

//     const maxCount = Math.max(...positions.map((pos) => pos.length / 3));
//     const mergedPositions = new Float32Array(maxCount * 3);

//     positions.forEach((pos, i) => {
//         const array = new Float32Array(pos);
//         mergedPositions.set(array, i * array.length);
//     });

//     const geometry = new THREE.BufferGeometry();
//     geometry.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));

//     const sizesArray = new Float32Array(maxCount).map(() => Math.random() * 5 + 3);
//     geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1));

//     const material = new THREE.ShaderMaterial({
//         vertexShader: `
//             attribute float aSize;
//             uniform float uSize;

//             void main() {
//                 vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//                 gl_PointSize = aSize * uSize * (1.0 / -mvPosition.z);
//                 gl_Position = projectionMatrix * mvPosition;
//             }
//         `,
//         fragmentShader: `
//             void main() {
//                 vec3 color = vec3(0.5, 0.8, 1.0);
//                 vec2 uv = gl_PointCoord - 0.5;
//                 float dist = length(uv);
//                 float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
//                 gl_FragColor = vec4(color, alpha);
//             }
//         `,
//         uniforms: {
//             uSize: { value: 2.0 },
//         },
//         blending: THREE.AdditiveBlending,
//         depthWrite: false,
//         transparent: true,
//     });

//     return new THREE.Points(geometry, material);
// }

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
console.log('Star.js loaded successfully.');

/**
 * Function to create a combined plane and particles object.
 * @param {THREE.Scene} scene - The scene to add the objects to.
 * @param {Object} sizes - The size of the window (width, height).
 * @param {string} modelPath - The path to the GLTF model.
 * @param {number} planeSize - Size of the plane.
 * @param {number} planeColor - Color of the plane.
 * @returns {Promise<THREE.Group>} - Returns a promise that resolves to a combined group.
 */
export function createPlaneWithParticles(scene, sizes, modelPath, planeSize, planeColor) {
    return new Promise((resolve, reject) => {
        const group = new THREE.Group();

        // Create the plane
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(planeSize, planeSize),
            new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(planeColor) },
                    opacity: { value: 0.9 },
                    emissiveColor: { value: new THREE.Color(planeColor) },
                    emissiveIntensity: { value: 1.0 },
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float opacity;
                    uniform vec3 emissiveColor;
                    uniform float emissiveIntensity;
                    varying vec2 vUv;

                    void main() {
                        float distanceFromCenter = distance(vUv, vec2(0.5, 0.5));
                        float falloff = smoothstep(0.0, 0.5, distanceFromCenter);
                        vec3 emissive = emissiveColor * emissiveIntensity * (1.0 - falloff);
                        vec3 finalColor = color + emissive;
                        gl_FragColor = vec4(finalColor, opacity * (1.0 - falloff));
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );

        group.add(plane); // Add the plane to the group

        // Load the particles
        const gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderPath('/draco/');
        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load(
            modelPath,
            (gltf) => {
                const particles = createParticlesFromGLTF(gltf, sizes);
                group.add(particles); // Add particles to the group
                scene.add(group); // Add the group to the scene
                dracoLoader.dispose();
                resolve(group); // Resolve with the combined group
            },
            undefined,
            (error) => {
                console.error('Error loading GLTF model:', error);
                reject(error);
            }
        );
    });
}

/**
 * Helper function to create particles from GLTF model.
 * @param {THREE.GLTF} gltf - The loaded GLTF model.
 * @param {Object} sizes - The size of the window (width, height).
 * @returns {THREE.Points} - The particles object.
 */
function createParticlesFromGLTF(gltf, sizes) {
    const positions = [];
    gltf.scene.traverse((child) => {
        if (child.geometry && child.geometry.attributes.position) {
            positions.push(child.geometry.attributes.position.array);
        }
    });

    if (positions.length === 0) {
        throw new Error('No valid geometry with position attribute found in the GLTF model.');
    }

    const maxCount = Math.max(...positions.map((pos) => pos.length / 3));
    const mergedPositions = new Float32Array(maxCount * 3);

    positions.forEach((pos, i) => {
        const array = new Float32Array(pos);
        const offset = i * array.length;
    
        // Ensure the write operation stays within bounds
        if (offset + array.length <= mergedPositions.length) {
            mergedPositions.set(array, offset);
        } else {
            console.warn(`Skipping data for index ${i} due to size mismatch.`);
        }
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));

    const sizesArray = new Float32Array(maxCount).map(() => Math.random() * 5 + 3);
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1));

    const material = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float aSize;
            uniform float uSize;

            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aSize * uSize * (1.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            void main() {
                vec3 color = vec3(0.5, 0.8, 1.0);
                vec2 uv = gl_PointCoord - 0.5;
                float dist = length(uv);
                float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            uSize: { value: 2.0 },
        },
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
    });

    return new THREE.Points(geometry, material);
}
