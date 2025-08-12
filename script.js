// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// Camera setup
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('model-container').appendChild(renderer.domElement);

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(3, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Helpers (keep these for debugging)
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

// Model loading with Blender-specific fixes
const loader = new THREE.GLTFLoader();

loader.load(
    'Cool guy low poly.glb',
    (gltf) => {
        const model = gltf.scene;
        
        // 1. Fix Blender scale issues
        model.scale.set(1, 1, 1);
        
        // 2. Check all parts exist
        console.log("=== Model Hierarchy ===");
        model.traverse((child) => {
            console.log(child.name, child.type);
            
            // 3. Make sure all meshes are visible
            if (child.isMesh) {
                child.visible = true;
                child.castShadow = true;
                child.receiveShadow = true;
                
                // 4. Fix potential material issues
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // 5. Center and position model properly
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        model.position.y += (size.y / 2); // Place feet on ground
        
        // 6. Special check for skinned meshes (if rigged)
        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }
        
        scene.add(model);
        document.getElementById('loading').style.display = 'none';
        
        console.log("Model loaded. Check hierarchy above for missing parts.");
    },
    undefined,
    (error) => {
        console.error('Error loading GLB:', error);
        document.getElementById('loading').textContent = 'Error loading model. See console.';
    }
);

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});