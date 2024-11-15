import * as THREE from 'three';

/**
 * Function to create a plane with emissive bloom effect.
 * @param {number} size - Size of the plane.
 * @param {number} color - Color of the plane.
 * @returns {THREE.Mesh} - The plane object.
 */
export function createPlaneWithBloom(size = 10, color = 0xFFFFFF ) {
    console.log(`Creating a plane with size: ${size} and color: ${color.toString(16)}`);

    // Create a plane geometry
    const planeGeometry = new THREE.PlaneGeometry(size, size);

    // Shader material for the glowing plane
    const planeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(color) },  // Apply color
            opacity: { value: 0.9 },
            emissiveColor: { value: new THREE.Color(color) }, // Apply emissive color
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
    });

    // Create the plane mesh
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    console.log('Plane with emissive bloom effect created successfully.');
    return plane;
}
