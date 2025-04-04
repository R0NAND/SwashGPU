import * as THREE from "three";
import loadWasm from "./wasmLoader.ts";

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);

camera.position.x = 30;
camera.position.y = 60;
camera.position.z = 30;
camera.lookAt(50, 50, 0);
const scene = new THREE.Scene();

const geometry = new THREE.SphereGeometry(0.4);
const material = new THREE.MeshNormalMaterial();

const n = 1000;
const mesh = new THREE.InstancedMesh(geometry, material, n);
scene.add(mesh);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);

loadWasm().then((w) => {
  const sim = w._initializeSim();
  const step = () => {
    const ptr = w._updateSim(sim);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 175; i++) {
      let x = w.HEAPF32[ptr / 4 + i * 18];
      let y = w.HEAPF32[ptr / 4 + i * 18 + 1];
      let z = w.HEAPF32[ptr / 4 + i * 18 + 2];
      dummy.position.set(x + 45, y + 45, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(step);
  document.body.appendChild(renderer.domElement);
});
