import "../style.css";
import assignCellShader from "./compute-shaders/assign-cell.wgsl";
import sortShader from "./compute-shaders/sort.wgsl";
import indexCellShader from "./compute-shaders/index-cell.wgsl";
import computePressureShader from "./compute-shaders/compute-pressure.wgsl";
import computeForceShader from "./compute-shaders/compute-force.wgsl";
import stepParticleShader from "./compute-shaders/step-particle.wgsl";
import {
  createBindGroupFromBuffers,
  createBindGroupsFromBufferSets,
  createPipeline,
} from "./util/factories";
import { createRenderPipeline } from "./pipelines/render-pipeline";
import { initGPU } from "./gpuContext";
import { mat4, vec3, vec4 } from "gl-matrix";
import {
  debugUint32Buffer,
  debugFloat32Buffer,
} from "./util/debug/debug-utils";

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
canvas.height = canvas.clientHeight;
canvas.width = canvas.clientHeight;
const spacing = 7.0;

const n_x = 40;
const n_y = 15;
const n_z = 20;
const n_particles = n_x * n_y * n_z;

const n_sorting = Math.pow(2, Math.ceil(Math.log2(n_particles)));

const positions = new Float32Array(n_particles * 4);
const velocities = new Float32Array(n_particles * 4);
const forces = new Float32Array(n_particles * 4);
const densities = new Float32Array(n_particles);
const pressures = new Float32Array(n_particles);

for (let x = 0; x < n_x; x++) {
  for (let y = 0; y < n_y; y++) {
    for (let z = 0; z < n_z; z++) {
      positions[4 * (x * n_y * n_z + y * n_z + z)] = x * spacing + 1;
      positions[4 * (x * n_y * n_z + y * n_z + z) + 1] = y * spacing + 1;
      positions[4 * (x * n_y * n_z + y * n_z + z) + 2] = z * spacing + 1;
    }
  }
}
const walls_x = spacing * n_x * 1.2;
const walls_y = spacing * n_y;
const walls_z = spacing * n_z * 1.2;
//const mvpArray = new Float32Array(mvpMatrix.elements);
const kernel_r = 20;
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

const params = new ArrayBuffer(128); // or 256 to be safe
const f32 = new Float32Array(params);
const i32 = new Int32Array(params);
const u32 = new Uint32Array(params);
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
f32[19] = 0.0; //padding
u32[20] = Math.ceil(walls_x / kernel_r); //sim bounds x
u32[21] = Math.ceil(walls_y / kernel_r); //sim bounds y
u32[22] = Math.ceil(walls_z / kernel_r); //sim bounds z
u32[23] = 0; //padding
f32[24] = walls_x;
f32[25] = walls_y;
f32[26] = walls_z;
f32[27] = 0; //padding

const n_cells = u32[20] * u32[21] * u32[22];

// Create matrices
const viewMatrix = mat4.create();
const projMatrix = mat4.create();
const mvpMatrix = mat4.create();

// Camera parameters
const eye = vec3.fromValues(175, 250, 400);
const center = vec3.fromValues(175, 50, 50);
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
  label: "particle velocity buffer",
  size: velocities.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC, //TODO
});

const forceBuffer = device.createBuffer({
  label: "particle force buffer",
  size: forces.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, //TODO
});

const densityBuffer = device.createBuffer({
  label: "particle density buffer",
  size: densities.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, //TODO
});

const pressureBuffer = device.createBuffer({
  label: "particle pressure buffer",
  size: pressures.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, //TODO
});

const positionBuffer = device.createBuffer({
  label: "particle position buffer",
  size: positions.byteLength,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

let bufferState = 0;
const toggleBufferState = () => {
  bufferState = bufferState === 0 ? 1 : 0;
};
const indexBuffers = [
  device.createBuffer({
    label: "index buffer 0",
    size: n_sorting * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST, // TODO: Remove COPY_SRC
  }),
  device.createBuffer({
    label: "index buffer 1",
    size: n_sorting * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, //TODO: Remove COPY_SRC
  }),
];
const cellBuffers = [
  device.createBuffer({
    label: "cell buffer 0",
    size: n_sorting * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST, // TODO: Remove COPY_SRC
  }),
  device.createBuffer({
    label: "cell buffer 1",
    size: n_sorting * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, //TODO: Remove COPY_SRC
  }),
];

const counterpartStrideBuffer = device.createBuffer({
  label: "bitonic sort counterpart stride",
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const directionStrideBuffer = device.createBuffer({
  label: "bitonic sort direction stride",
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const cellClearArray = new Uint32Array(n_cells).fill(0xffffffff);
const staticCellClearBuffer = device.createBuffer({
  label: "static cell clear buffer",
  size: n_cells * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
});
const cellStartBuffer = device.createBuffer({
  label: "cell start index buffer",
  size: n_cells * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
});

const cellEndBuffer = device.createBuffer({
  label: "cell end index buffer",
  size: n_cells * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
});

const projectionBuffer = device.createBuffer({
  label: "Projection Matrix Uniform",
  size: 64, // 4x4 floats = 64 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const viewBuffer = device.createBuffer({
  label: "View Matrix Uniform",
  size: 64, // 4x4 floats = 64 bytes
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const particleOffetsBuffer = device.createBuffer({
  label: "Particle Offsets Buffer",
  size: quadOffsets.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const rayOriginBuffer = device.createBuffer({
  label: "Ray Origin Buffer",
  size: 12,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const rayDirBuffer = device.createBuffer({
  label: "Ray Direction Buffer",
  size: 12,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(simParamsBuffer, 0, params);
device.queue.writeBuffer(positionBuffer, 0, positions);
device.queue.writeBuffer(projectionBuffer, 0, projMatrix as Float32Array);
device.queue.writeBuffer(viewBuffer, 0, viewMatrix as Float32Array);
device.queue.writeBuffer(particleOffetsBuffer, 0, quadOffsets);
device.queue.writeBuffer(staticCellClearBuffer, 0, cellClearArray);

const { bindGroup: assignCellBindGroup, layout: assignCellLayout } =
  createBindGroupFromBuffers(
    device,
    [simParamsBuffer, positionBuffer],
    ["uniform", "read-only-storage"],
    GPUShaderStage.COMPUTE
  );

const { bindGroups: assignCellWriteBindGroups, layout: assignCellWriteLayout } =
  createBindGroupsFromBufferSets(
    device,
    [
      [indexBuffers[0], cellBuffers[0]],
      [indexBuffers[1], cellBuffers[1]],
    ],
    ["storage", "storage"],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: sortStridesBindGroup, layout: sortStridesLayout } =
  createBindGroupFromBuffers(
    device,
    [simParamsBuffer, counterpartStrideBuffer, directionStrideBuffer],
    ["uniform", "uniform", "uniform"],
    GPUShaderStage.COMPUTE
  );
const { bindGroups: sortBuffersBindGroups, layout: sortBuffersLayout } =
  createBindGroupsFromBufferSets(
    device,
    [
      [cellBuffers[0], indexBuffers[0], cellBuffers[1], indexBuffers[1]],
      [cellBuffers[1], indexBuffers[1], cellBuffers[0], indexBuffers[0]],
    ],
    ["read-only-storage", "read-only-storage", "storage", "storage"],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: indexCellBindGroup, layout: indexCellLayout } =
  createBindGroupFromBuffers(
    device,
    [simParamsBuffer, cellStartBuffer, cellEndBuffer],
    ["uniform", "storage", "storage"],
    GPUShaderStage.COMPUTE
  );
const { bindGroups: indexCellWriteBindGroups, layout: indexCellWriteLayout } =
  createBindGroupsFromBufferSets(
    device,
    [[cellBuffers[0]], [cellBuffers[1]]],
    ["read-only-storage"],
    GPUShaderStage.COMPUTE
  );
const { bindGroups: particleIndicesBindGroups, layout: particleIndicesLayout } =
  createBindGroupsFromBufferSets(
    device,
    [[indexBuffers[0]], [indexBuffers[1]]],
    ["read-only-storage"],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: calcPressureBindGroup, layout: calcPressureLayout } =
  createBindGroupFromBuffers(
    device,
    [
      simParamsBuffer,
      cellStartBuffer,
      cellEndBuffer,
      positionBuffer,
      velocityBuffer,
      densityBuffer,
      pressureBuffer,
    ],
    [
      "uniform",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "storage",
      "storage",
    ],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: calcForceBindGroup, layout: calcForceLayout } =
  createBindGroupFromBuffers(
    device,
    [
      simParamsBuffer,
      cellStartBuffer,
      cellEndBuffer,
      positionBuffer,
      velocityBuffer,
      densityBuffer,
      pressureBuffer,
      forceBuffer,
    ],
    [
      "uniform",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "storage",
    ],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: stepParticleBindGroup, layout: stepParticleLayout } =
  createBindGroupFromBuffers(
    device,
    [
      simParamsBuffer,
      rayOriginBuffer,
      rayDirBuffer,
      positionBuffer,
      velocityBuffer,
      forceBuffer,
      densityBuffer,
      pressureBuffer,
    ],
    [
      "uniform",
      "uniform",
      "uniform",
      "storage",
      "storage",
      "storage",
      "storage",
      "storage",
    ],
    GPUShaderStage.COMPUTE
  );

const { bindGroup: renderBindGroup, layout: renderLayout } =
  createBindGroupFromBuffers(
    device,
    [viewBuffer, projectionBuffer],
    ["uniform", "uniform"],
    GPUShaderStage.VERTEX
  );

const assignCellPipeline = createPipeline(
  device,
  [assignCellLayout, assignCellWriteLayout],
  "Assign Cell",
  assignCellShader
);
const indexCellPipeline = createPipeline(
  device,
  [indexCellLayout, indexCellWriteLayout],
  "Index Cell",
  indexCellShader
);
const sortPipeline = createPipeline(
  device,
  [sortStridesLayout, sortBuffersLayout],
  "Sort",
  sortShader
);
const pressurePipeline = createPipeline(
  device,
  [calcPressureLayout, particleIndicesLayout],
  "Calculate Pressure",
  computePressureShader
);
const forcePipeline = createPipeline(
  device,
  [calcForceLayout, particleIndicesLayout],
  "Calculate Force",
  computeForceShader
);
const particlePipeline = createPipeline(
  device,
  [stepParticleLayout],
  "Step Particle",
  stepParticleShader
);

const renderPipeline = createRenderPipeline(device, renderLayout, canvasFormat);

const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: "depth24plus",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

const executeComputePass = (
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroups: GPUBindGroup[],
  workgroupSize: number,
  n_threads: number = n_particles
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  for (let i = 0; i < bindGroups.length; i++) {
    pass.setBindGroup(i, bindGroups[i]);
  }
  pass.dispatchWorkgroups(Math.ceil(n_threads / workgroupSize));
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

const n_sort_passes = Math.log2(n_sorting);
let lastFrameTime = performance.now();
const fpsLabel = document.getElementById("fps");
const step = async () => {
  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  const fps = 1000 / deltaTime;
  if (fpsLabel) {
    fpsLabel.textContent = `FPS: ${fps.toFixed(1)}`;
  }
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

  let encoder = device.createCommandEncoder();
  bufferState = 0;
  executeComputePass(
    encoder,
    assignCellPipeline,
    [assignCellBindGroup, assignCellWriteBindGroups[bufferState]],
    256,
    n_sorting
  );
  for (let i = 1; i <= n_sort_passes; i++) {
    let direction_stride = new Uint32Array([Math.pow(2, i)]);
    device.queue.writeBuffer(directionStrideBuffer, 0, direction_stride);
    for (let j = 1; j <= i; j++) {
      let counterpart_stride = new Uint32Array([Math.pow(2, i - j)]);
      device.queue.writeBuffer(counterpartStrideBuffer, 0, counterpart_stride);
      executeComputePass(
        encoder,
        sortPipeline,
        [sortStridesBindGroup, sortBuffersBindGroups[bufferState]],
        256,
        n_sorting
      );
      device.queue.submit([encoder.finish()]);
      encoder = device.createCommandEncoder();
      toggleBufferState();
    }
  }

  encoder.copyBufferToBuffer(staticCellClearBuffer, 0, cellStartBuffer, 0);
  encoder.copyBufferToBuffer(staticCellClearBuffer, 0, cellEndBuffer, 0);
  executeComputePass(
    encoder,
    indexCellPipeline,
    [indexCellBindGroup, indexCellWriteBindGroups[bufferState]],
    256
  );
  executeComputePass(
    encoder,
    pressurePipeline,
    [calcPressureBindGroup, particleIndicesBindGroups[bufferState]],
    256
  );
  executeComputePass(
    encoder,
    forcePipeline,
    [calcForceBindGroup, particleIndicesBindGroups[bufferState]],
    256
  );
  executeComputePass(encoder, particlePipeline, [stepParticleBindGroup], 256);

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
