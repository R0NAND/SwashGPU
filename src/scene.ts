import * as THREE from "three";
import pressureShader from "./compute-pressure.wgsl";
import forcesShader from "./compute-forces.wgsl";
import particleShader from "./compute-particles.wgsl";

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);

camera.position.x = 5;
camera.position.y = 10;
camera.position.z = 20;
camera.lookAt(5, 5, 5);
const scene = new THREE.Scene();

const geometry = new THREE.SphereGeometry(0.5);
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.InstancedMesh(geometry, material, 1000);
scene.add(mesh);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);

const floatsPerParticle = 20;
const dummyPoints = [];
const spacing = 1.0;

const n_x = 10;
const n_y = 10;
const n_z = 10;
const n_particles = n_x * n_y * n_z;

for (let x = 0; x < n_x; x++) {
  for (let y = 0; y < n_y; y++) {
    for (let z = 0; z < n_z; z++) {
      dummyPoints.push(
        //POSITION
        x * spacing,
        y * spacing,
        z * spacing,
        0.0,
        //VELOCITY
        0.0,
        0.0,
        0.0,
        0.0,
        //FORCE
        0.0,
        0.0,
        0.0,
        0.0,
        //COLOR
        0.0,
        0.0,
        0.0,
        0.0,
        //DENSITY
        0.0,
        //PRESSURE
        0.0,
        0.0,
        0.0
      );
    }
  }
}

let particleData = new Float32Array(dummyPoints);

const kernel_r = 2;
const kernel_r2 = kernel_r * kernel_r;
const mass = 1.0;
const viscosity = 0.5;
const stiffness = 10;
const restDensity = 0.1;
const surfaceTension = 2.0;

const k_poly_6 = 315.0 / (64.0 * Math.PI * Math.pow(kernel_r, 9));
const k_lap_poly_6 = 945.0 / (32.0 * Math.PI * Math.pow(kernel_r, 9));
const k_spiky = 45.0 / (Math.PI * Math.pow(kernel_r, 6));
const k_visc = 45.0 / (Math.PI * Math.pow(kernel_r, 6));

const buffer = new ArrayBuffer(80); // or 256 to be safe
const f32 = new Float32Array(buffer);
const i32 = new Int32Array(buffer);
f32[0] = 0.016666666666667; //dt
f32[1] = kernel_r;
f32[2] = kernel_r2;
f32[3] = mass;
f32[4] = viscosity;
f32[5] = stiffness;
f32[6] = restDensity;
f32[7] = surfaceTension;
f32[8] = k_poly_6;
f32[9] = k_lap_poly_6;
f32[10] = k_spiky;
f32[11] = k_visc;
i32[12] = n_particles; //n_particles
f32[16] = 0.0; //gravity
f32[17] = -0.5; //gravity
f32[18] = 0.0; //gravity

const renderPoints = (points: Float32Array) => {
  const dummy = new THREE.Object3D();
  for (let i = 0; i < particleData.length; i++) {
    dummy.position.set(
      points[i * floatsPerParticle],
      points[i * floatsPerParticle + 1],
      points[i * floatsPerParticle + 2]
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(Math.floor(i), dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
  renderer.render(scene, camera);
};

document.body.appendChild(renderer.domElement);

renderPoints(particleData);

if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const simParamsBuffer = device.createBuffer({
  label: "Sim Params Uniform",
  size: buffer.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(simParamsBuffer, 0, buffer);

const particleBuffer = device.createBuffer({
  label: "Particle Positions Storage",
  size: particleData.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  mappedAtCreation: true,
});
new Float32Array(particleBuffer.getMappedRange()).set(particleData);
particleBuffer.unmap();

const readbackBuffer = device.createBuffer({
  size: particleData.byteLength,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
});

const densityShaderModule = device.createShaderModule({
  label: "Integrator Shader",
  code: pressureShader,
});

const forceShaderModule = device.createShaderModule({
  label: "Integrator Shader",
  code: forcesShader,
});

const particleShaderModule = device.createShaderModule({
  label: "Particle Shader",
  code: particleShader,
});

const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "uniform" },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "storage" },
    },
  ],
});

const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: simParamsBuffer },
    },
    {
      binding: 1,
      resource: { buffer: particleBuffer },
    },
  ],
});

const pressurePipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  compute: { module: densityShaderModule, entryPoint: "computeMain" },
});

const forcePipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  compute: { module: forceShaderModule, entryPoint: "computeMain" },
});

const wallPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
  compute: { module: particleShaderModule, entryPoint: "computeMain" },
});

const step = async () => {
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pressurePipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(4);

  pass.setPipeline(forcePipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(4);

  pass.setPipeline(wallPipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(4);
  pass.end();
  encoder.copyBufferToBuffer(
    particleBuffer,
    0,
    readbackBuffer,
    0,
    particleData.byteLength
  );
  device.queue.submit([encoder.finish()]);

  await readbackBuffer.mapAsync(GPUMapMode.READ); // Wait for the buffer to be ready
  const mappedRange = readbackBuffer.getMappedRange(); // Get the updated data
  const newPoints = new Float32Array(mappedRange); // Map it to a Float32Array
  renderPoints(newPoints);
  readbackBuffer.unmap();
  requestAnimationFrame(step);
};

requestAnimationFrame(step);
