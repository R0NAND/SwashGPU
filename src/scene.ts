import "../style.css";
import { createForcePipeline } from "./pipelines/force-pipeline";
import { createPressurePipeline } from "./pipelines/pressure-pipeline";
import { createParticlePipeline } from "./pipelines/particle-pipeline";
import { createRenderPipeline } from "./pipelines/render-pipeline";
import { createAssignCellPipeline } from "./pipelines/assign-cell-pipeline";
import { createIndexCellPipeline } from "./pipelines/index-cell-pipeline";
import { createSortStridesBindGroup } from "./bind-groups/sort-strides-group";
import { createSortPipeline } from "./pipelines/sort-pipeline";
import { createCalcForceBindGroup } from "./bind-groups/calc-force-group";
import { createCalcPressureBindGroup } from "./bind-groups/calc-pressure-group";
import { createStepParticleBindGroup } from "./bind-groups/step-particle-group";
import { createAssignCellBindGroup } from "./bind-groups/assign-cell-group";
import { createIndexCellBindGroup } from "./bind-groups/index-cell-group";
import { createSortBindGroup } from "./bind-groups/sort-group";
import { createRenderBindGroup } from "./bind-groups/render-group";
import { initGPU } from "./gpuContext";
import { mat4, vec3, vec4 } from "gl-matrix";

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
canvas.height = canvas.clientHeight;
canvas.width = canvas.clientHeight;
const spacing = 7.0;

const n_x = 32;
const n_y = 15;
const n_z = 12;
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
//const mvpArray = new Float32Array(mvpMatrix.elements);
const kernel_r = 20;
const kernel_r2 = kernel_r * kernel_r;
const mass = 1.0;
const viscosity = 0.5;
const stiffness = 1000;
const restDensity = 0.001;
const surfaceTension = 0.001;

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
u32[20] = Math.ceil(300.0 / kernel_r); //sim bounds x
u32[21] = Math.ceil(150.0 / kernel_r); //sim bounds y
u32[22] = Math.ceil(100.0 / kernel_r); //sim bounds z

const n_cells = u32[20] * u32[21] * u32[22];

// Create matrices
const viewMatrix = mat4.create();
const projMatrix = mat4.create();
const mvpMatrix = mat4.create();

// Camera parameters
const eye = vec3.fromValues(125, 200, 300);
const center = vec3.fromValues(150, 50, 50);
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

const indices_fill_array = new Uint32Array(n_sorting).fill(0xfffffff);
const indexBuffers = [
  device.createBuffer({
    label: "index read buffer",
    size: n_sorting * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // TODO: Remove COPY_SRC
  }),
  device.createBuffer({
    label: "index write buffer",
    size: n_sorting * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC, //TODO: Remove COPY_SRC
  }),
];
const cellBuffers = [
  device.createBuffer({
    label: "cell read buffer",
    size: n_sorting * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // TODO: Remove COPY_SRC
  }),
  device.createBuffer({
    label: "cell write buffer",
    size: n_sorting * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC, //TODO: Remove COPY_SRC
  }),
];

const counterpartStrideBuffer = device.createBuffer({
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const directionStrideBuffer = device.createBuffer({
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const cellClearArray = new Uint32Array(n_cells).fill(0xfffffff);
const staticCellClearBuffer = device.createBuffer({
  size: n_cells * 4,
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
});
const cellStartBuffer = device.createBuffer({
  size: n_cells * 4,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const cellEndBuffer = device.createBuffer({
  size: n_cells * 4,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
device.queue.writeBuffer(cellBuffers[1], 0, indices_fill_array);
device.queue.writeBuffer(indexBuffers[1], 0, indices_fill_array);
device.queue.writeBuffer(staticCellClearBuffer, 0, cellClearArray);
type BufferBindingType = "uniform" | "storage" | "read-only-storage";

interface BindGroupResult {
  layout: GPUBindGroupLayout;
  bindGroup: GPUBindGroup;
}

function createBindGroupFromBuffers(
  device: GPUDevice,
  buffers: GPUBuffer[],
  types: BufferBindingType[],
  visibility: number = GPUShaderStage.COMPUTE |
    GPUShaderStage.VERTEX |
    GPUShaderStage.FRAGMENT
): BindGroupResult {
  if (buffers.length !== types.length) {
    throw new Error("buffers and types arrays must be the same length.");
  }

  const entries: GPUBindGroupLayoutEntry[] = buffers.map((_, i) => ({
    binding: i,
    visibility,
    buffer: { type: types[i] as GPUBufferBindingType },
  }));

  const layout = device.createBindGroupLayout({ entries });

  const bindGroupEntries: GPUBindGroupEntry[] = buffers.map((buffer, i) => ({
    binding: i,
    resource: { buffer },
  }));

  const bindGroup = device.createBindGroup({
    layout,
    entries: bindGroupEntries,
  });

  return { layout, bindGroup };
}

const { bindGroup: assignCellBindGroup, layout: assignCellLayout } =
  createBindGroupFromBuffers(
    device,
    [simParamsBuffer, positionBuffer, indexWriteBuffer, cellWriteBuffer],
    ["uniform", "read-only-storage", "storage", "storage"]
  );

const { bindGroup: indexCellBindGroup, layout: indexCellLayout } =
  createBindGroupFromBuffers(
    device,
    [simParamsBuffer, cellReadBuffer, cellStartBuffer, cellEndBuffer],
    ["uniform", "read-only-storage", "storage", "storage"]
  );

const { bindGroup: sortStridesBindGroup, layout: sortStridesLayout } =
  createBindGroupFromBuffers(
    device,
    [directionStrideBuffer, counterpartStrideBuffer],
    ["storage", "read-only-storage"]
  );

const { bindGroup: sortBindGroup, layout: sortLayout } =
  createBindGroupFromBuffers(
    device,
    [cellReadBuffer, indexReadBuffer, cellWriteBuffer, indexWriteBuffer],
    ["read-only-storage", "read-only-storage", "storage", "storage"]
  );

const { bindGroup: calcPressureBindGroup, layout: calcPressureLayout } =
  createBindGroupFromBuffers(
    device,
    [
      simParamsBuffer,
      positionBuffer,
      velocityBuffer,
      densityBuffer,
      pressureBuffer,
    ],
    ["uniform", "read-only-storage", "read-only-storage", "storage", "storage"]
  );

const { bindGroup: calcForceBindGroup, layout: calcForceLayout } =
  createBindGroupFromBuffers(
    device,
    [
      simParamsBuffer,
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
      "storage",
    ]
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
      "read-only-storage",
      "read-only-storage",
      "storage",
      "storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
    ]
  );

const { bindGroup: renderBindGroup, layout: renderLayout } =
  createBindGroupFromBuffers(
    device,
    [viewBuffer, projectionBuffer],
    ["uniform", "uniform"]
  );

const assignCellPipeline = createAssignCellPipeline(device);
const indexCellPipeline = createIndexCellPipeline(device);
const sortPipeline = createSortPipeline(device);
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
  bindGroups: GPUBindGroup[],
  workgroupSize: number
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  for (let i = 0; i < bindGroups.length; i++) {
    pass.setBindGroup(i, bindGroups[i]);
  }
  pass.dispatchWorkgroups(Math.ceil(n_particles / workgroupSize));
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
async function debugReadBuffer(
  device: GPUDevice,
  source: GPUBuffer,
  size: number // in bytes
): Promise<Uint32Array> {
  const readBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(source, 0, readBuffer, 0, size);
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = readBuffer.getMappedRange();
  const copy = new Uint32Array(arrayBuffer.slice());
  readBuffer.unmap();
  readBuffer.destroy();
  return copy;
}
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
  executeComputePass(encoder, assignCellPipeline, [assignCellBindGroup], 256);
  [cellReadBuffer, cellWriteBuffer] = [cellWriteBuffer, cellReadBuffer];
  [indexReadBuffer, indexWriteBuffer] = [indexWriteBuffer, indexReadBuffer];

  for (let i = 1; i <= n_sort_passes; i++) {
    let direction_stride = new Uint32Array([Math.pow(2, i)]);
    device.queue.writeBuffer(directionStrideBuffer, 0, direction_stride);
    for (let j = 1; j <= i; j++) {
      let counterpart_stride = new Uint32Array([Math.pow(2, i - j)]);
      device.queue.writeBuffer(counterpartStrideBuffer, 0, counterpart_stride);
      executeComputePass(
        encoder,
        sortPipeline,
        [sortStridesBindGroup, sortBindGroup],
        256
      );
      device.queue.submit([encoder.finish()]); //TODO: Remove this later
      const result = await debugReadBuffer(
        device,
        indexReadBuffer,
        n_sorting * 4
      );
      console.log(result);
      debugger;
      [cellReadBuffer, cellWriteBuffer] = [cellWriteBuffer, cellReadBuffer];
      [indexReadBuffer, indexWriteBuffer] = [indexWriteBuffer, indexReadBuffer];
    }
  }

  encoder.copyBufferToBuffer(staticCellClearBuffer, 0, cellStartBuffer, 0);
  encoder.copyBufferToBuffer(staticCellClearBuffer, 0, cellEndBuffer, 0);
  executeComputePass(encoder, indexCellPipeline, [indexCellBindGroup], 256);
  executeComputePass(encoder, pressurePipeline, [calcPressureBindGroup], 256);
  executeComputePass(encoder, forcePipeline, [calcForceBindGroup], 256);
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
