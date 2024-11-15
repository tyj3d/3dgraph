// src/main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const scene = new THREE.Scene();

// Function to create a plane with bloom and add it to the scene.
export function createPlaneWithBloom(scene) {
    console.log('Creating a plane with emissive bloom effect');

    // Create a plane geometry
    const planeGeometry = new THREE.PlaneGeometry(1.75, 1.75);

    // Shader material for the glowing plane
    const planeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },  // Base color of the plane
            opacity: { value: 0.9 },                     // Base opacity
            emissiveColor: { value: new THREE.Color(0xffffff) }, // Emissive color
            emissiveIntensity: { value: 0.5 },           // Emission intensity
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
                // Calculate distance from the center of the plane (0.5, 0.5 in UV space)
                float distanceFromCenter = distance(vUv, vec2(0.5));
                
                // Create a smoother falloff for the glow effect
                float falloff = smoothstep(0.0, 0.5, distanceFromCenter);

                // Calculate emissive glow
                vec3 emissive = emissiveColor * emissiveIntensity * (1.0 - falloff);

                // Combine base color with emissive glow
                vec3 finalColor = color + emissive;

                // Apply falloff and opacity
                gl_FragColor = vec4(finalColor, opacity * (1.0 - falloff));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending, // Additive blending for a glowing effect
        depthWrite: false, // Disable depth writing for transparency blending
    });

    // Create the plane mesh
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    console.log('Plane with emissive bloom effect added to scene');
    return plane;
}

// Function to setup particles and add them to the scene.
export function createParticles(scene, sizes, modelPath) {
    return new Promise((resolve, reject) => {
        const gltfLoader = new GLTFLoader();

        // Configure and add DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/'); // Path to the Draco decoder files
        gltfLoader.setDRACOLoader(dracoLoader);

        // Load the GLTF model
        gltfLoader.load(
            "/static/starmodels3.glb", 
            //modelpath,
            (gltf) => {
                console.log("GLTF model loaded successfully:", gltf);

                // Create particles from the GLTF geometry
                const particles = createParticlesFromGLTF(gltf, sizes);
                   
                // Add particles to the scene
                scene.add(particles);

                // Clean up DRACOLoader after loading
                dracoLoader.dispose();

                // Resolve the promise with the particles
                resolve(particles);
            },
            undefined,
            (error) => {
                console.error("Error loading GLTF model:", error);
                reject(error); // Reject the promise if there's an error
            }
        );
    });
}

// Helper function to create particles from GLTF model.
function createParticlesFromGLTF(gltf, sizes) {
    const particles = {};
    particles.index = 0;

    // Extract positions from GLTF geometry
    const positions = gltf.scene.children
        .filter((child) => child.geometry && child.geometry.attributes.position)
        .map((child) => child.geometry.attributes.position);

    if (!positions.length) {
        throw new Error("No valid geometry with position attribute found in the GLTF model.");
    }

    particles.maxCount = Math.max(...positions.map((pos) => pos.count));

    particles.positions = positions.map((pos) => {
        const originalArray = pos.array;
        const newArray = new Float32Array(particles.maxCount * 3);

        for (let i = 0; i < particles.maxCount; i++) {
            const i3 = i * 3;
            if (i3 < originalArray.length) {
                newArray.set(originalArray.slice(i3, i3 + 3), i3);
            } else {
                const randIndex = Math.floor(pos.count * Math.random()) * 3;
                newArray.set(originalArray.slice(randIndex, randIndex + 3), i3);
            }
        }

        return new THREE.Float32BufferAttribute(newArray, 3);
    });

    // Setup geometry for particles
    particles.geometry = new THREE.BufferGeometry();
    particles.geometry.setAttribute('position', particles.positions[0]);

    // Increase the size of the particles
    const sizesArray = new Float32Array(particles.maxCount).map(() => Math.random() * 20 + 5);
    particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1));

    // Shader material for glowing particles
    particles.material = new THREE.ShaderMaterial({
        vertexShader: `
            precision mediump float;
            uniform float uSize;
            attribute float aSize;

            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                // Adjust point size based on depth to keep particles the same size on screen
                gl_PointSize = aSize * uSize * (1.0 / -mvPosition.z);

                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            precision mediump float;

            uniform vec3 emissiveColor;
            uniform float emissiveIntensity;

            void main() {
                vec3 color = emissiveColor * emissiveIntensity;
                vec2 uv = gl_PointCoord - 0.5;
                float dist = length(uv);
                float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        uniforms: {
            uSize: { value: 0.8 }, // Adjusted size for visibility
            emissiveColor: { value: new THREE.Color(0xffffff) },
            emissiveIntensity: { value: 1.5 },
        },
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
    });

    // Create Points and return
    const points = new THREE.Points(particles.geometry, particles.material);
    return points;
}
