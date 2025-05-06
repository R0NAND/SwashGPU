import "../style.css";
import { createForcePipeline } from "./pipelines/force-pipeline";
import { createPressurePipeline } from "./pipelines/pressure-pipeline";
import { createParticlePipeline } from "./pipelines/particle-pipeline";
import { createRenderPipeline } from "./pipelines/render-pipeline";
import { createCalcForceBindGroup } from "./bind-groups/calc-force-group";
import { createCalcPressureBindGroup } from "./bind-groups/calc-pressure-group";
import { createStepParticleBindGroup } from "./bind-groups/step-particle-group";
import { createRenderBindGroup } from "./bind-groups/render-group";
import { initGPU } from "./gpuContext";
import { mat4, vec3, vec4 } from "gl-matrix";

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
const spacing = 7.0;

const n_x = 10;
const n_y = 100;
const n_z = 10;
const n_particles = n_x * n_y * n_z;

const positions = new Float32Array(n_particles * 4);
const velocities = new Float32Array(n_particles * 4);
const forces = new Float32Array(n_particles * 4);
const densities = new Float32Array(n_particles);
const pressures = new Float32Array(n_particles);

for (let x = 0; x < n_x; x++) {
  for (let y = 0; y < n_y; y++) {
    for (let z = 0; z < n_z; z++) {
      positions[4 * (x * n_y * n_z + y * n_z + z)] = x * spacing + 1;
      positions[4 * (x * n_y * n_z + y * n_z + z) + 1] = y * spacing + 10;
      positions[4 * (x * n_y * n_z + y * n_z + z) + 2] = z * spacing + 1;
    }
  }
}
//const mvpArray = new Float32Array(mvpMatrix.elements);
const kernel_r = 30;
const kernel_r2 = kernel_r * kernel_r;
const mass = 1.0;
const viscosity = 0.5;
const stiffness = 1000;
const restDensity = 0.0001;
const surfaceTension = 0.005;

const k_poly_6 = 315.0 / (64.0 * Math.PI * Math.pow(kernel_r, 9));
const k_lap_poly_6 = 945.0 / (32.0 * Math.PI * Math.pow(kernel_r, 9));
const k_spiky = 45.0 / (Math.PI * Math.pow(kernel_r, 6));
const k_visc = 45.0 / (Math.PI * Math.pow(kernel_r, 6));

const params = new ArrayBuffer(80); // or 256 to be safe
const f32 = new Float32Array(params);
const i32 = new Int32Array(params);
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
f32[17] = -5; //gravity
f32[18] = 0.0; //gravity

// Create matrices
const viewMatrix = mat4.create();
const projMatrix = mat4.create();
const mvpMatrix = mat4.create();

// Camera parameters
const eye = vec3.fromValues(100, 150, 300);
const center = vec3.fromValues(100, 50, 50);
const up = vec3.fromValues(0, 1, 0);

// Build view matrix
mat4.lookAt(viewMatrix, eye, center, up);

const aspect = canvas.clientWidth / canvas.clientHeight;
mat4.perspective(projMatrix, (70 * Math.PI) / 180, aspect, 0.01, 1000);

mat4.multiply(mvpMatrix, projMatrix, viewMatrix);

const quadOffsets = new Float32Array([
  -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
]);

const { device, context, canvasFormat } = await initGPU(canvas);

const simParamsBuffer = device.createBuffer({
  label: "Sim Params Uniform",
  size: params.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const velocityBuffer = device.createBuffer({
  size: velocities.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
});

const forceBuffer = device.createBuffer({
  size: forces.byteLength,
  usage: GPUBufferUsage.STORAGE,
});

const densityBuffer = device.createBuffer({
  size: densities.byteLength,
  usage: GPUBufferUsage.STORAGE,
});

const pressureBuffer = device.createBuffer({
  size: pressures.byteLength,
  usage: GPUBufferUsage.STORAGE,
});

const positionBuffer = device.createBuffer({
  size: positions.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const projectionBuffer = device.createBuffer({
  size: 64, // 4x4 floats = 64 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const viewBuffer = device.createBuffer({
  size: 64, // 4x4 floats = 64 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const particleOffetsBuffer = device.createBuffer({
  size: quadOffsets.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const rayOriginBuffer = device.createBuffer({
  size: 12,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const rayDirBuffer = device.createBuffer({
  size: 12,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(simParamsBuffer, 0, params);
device.queue.writeBuffer(positionBuffer, 0, positions);
device.queue.writeBuffer(projectionBuffer, 0, projMatrix as Float32Array);
device.queue.writeBuffer(viewBuffer, 0, viewMatrix as Float32Array);
device.queue.writeBuffer(particleOffetsBuffer, 0, quadOffsets);

const calcPressureBindGroup = createCalcPressureBindGroup(
  device,
  simParamsBuffer,
  positionBuffer,
  velocityBuffer,
  densityBuffer,
  pressureBuffer
);
const calcForceBindGroup = createCalcForceBindGroup(
  device,
  simParamsBuffer,
  positionBuffer,
  velocityBuffer,
  densityBuffer,
  pressureBuffer,
  forceBuffer
);
const stepParticleBindGroup = createStepParticleBindGroup(
  device,
  simParamsBuffer,
  rayOriginBuffer,
  rayDirBuffer,
  positionBuffer,
  velocityBuffer,
  forceBuffer,
  densityBuffer,
  pressureBuffer
);
const renderBindGroup = createRenderBindGroup(
  device,
  viewBuffer,
  projectionBuffer
);

const pressurePipeline = createPressurePipeline(device);
const forcePipeline = createForcePipeline(device);
const particlePipeline = createParticlePipeline(device);
const renderPipeline = createRenderPipeline(device, canvasFormat);

const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const executeComputePass = (
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroup: GPUBindGroup,
  workgroupSize: number
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.round(n_particles / workgroupSize));
  pass.end();
};

let mouseX = -1;
let mouseY = -1;
canvas.style.touchAction = "none";

const pointerMoveEvent = (e: PointerEvent) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
};

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId); // Captures pointer during drag
  canvas.addEventListener("pointermove", pointerMoveEvent);
});

canvas.addEventListener("pointerup", (e) => {
  canvas.releasePointerCapture(e.pointerId);
  canvas.removeEventListener("pointermove", pointerMoveEvent);
  mouseX = -1;
  mouseY = -1;
});

const step = async () => {
  const x = (mouseX / canvas.clientWidth) * 2 - 1;
  const y = -(mouseY / canvas.clientHeight) * 2 + 1;
  const invViewProj = mat4.invert(mat4.create(), mvpMatrix);
  const pNear = vec4.transformMat4(vec4.create(), [x, y, -1, 1], invViewProj);
  const pFar = vec4.transformMat4(vec4.create(), [x, y, 1, 1], invViewProj);
  vec4.scale(pNear, pNear, 1 / pNear[3]);
  vec4.scale(pFar, pFar, 1 / pFar[3]);
  const rayOrigin = [pNear[0], pNear[1], pNear[2]] as vec3;
  const rayDir = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), [pFar[0], pFar[1], pFar[2]], rayOrigin)
  );

  device.queue.writeBuffer(rayOriginBuffer, 0, new Float32Array(rayOrigin));
  device.queue.writeBuffer(rayDirBuffer, 0, new Float32Array(rayDir));

  const encoder = device.createCommandEncoder();
  executeComputePass(encoder, pressurePipeline, calcPressureBindGroup, 256);
  executeComputePass(encoder, forcePipeline, calcForceBindGroup, 256);
  executeComputePass(encoder, particlePipeline, stepParticleBindGroup, 256);

  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",
    },
  });

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  renderPass.setVertexBuffer(0, particleOffetsBuffer); // 6 vertices
  renderPass.setVertexBuffer(1, positionBuffer); // n_particles instances
  renderPass.setVertexBuffer(2, velocityBuffer);
  renderPass.draw(6, n_particles);
  renderPass.end();
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(step);
};

requestAnimationFrame(step);
