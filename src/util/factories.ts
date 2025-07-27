type BufferBindingType = "uniform" | "storage" | "read-only-storage";

function createSharedBindGroupLayout(
  device: GPUDevice,
  types: BufferBindingType[],
  visibility: number
): GPUBindGroupLayout {
  return device.createBindGroupLayout({
    entries: types.map((type, i) => ({
      binding: i,
      visibility,
      buffer: { type: type as GPUBufferBindingType },
    })),
  });
}

export function createBindGroupFromBuffers(
  device: GPUDevice,
  buffers: GPUBuffer[],
  types: BufferBindingType[],
  visibility: number = GPUShaderStage.COMPUTE
): { layout: GPUBindGroupLayout; bindGroup: GPUBindGroup } {
  if (buffers.length !== types.length) {
    throw new Error("buffers and types must be the same length");
  }

  const layout = createSharedBindGroupLayout(device, types, visibility);

  const bindGroup = device.createBindGroup({
    layout,
    entries: buffers.map((buffer, i) => ({
      binding: i,
      resource: { buffer },
    })),
  });

  return { layout, bindGroup };
}

export function createBindGroupsFromBufferSets(
  device: GPUDevice,
  bufferSets: GPUBuffer[][],
  types: BufferBindingType[],
  visibility: number = GPUShaderStage.COMPUTE
): { layout: GPUBindGroupLayout; bindGroups: GPUBindGroup[] } {
  for (const buffers of bufferSets) {
    if (buffers.length !== types.length) {
      throw new Error(
        "Each buffer set must match the length of the binding types array."
      );
    }
  }

  const layout = createSharedBindGroupLayout(device, types, visibility);

  const bindGroups = bufferSets.map((buffers) =>
    device.createBindGroup({
      layout,
      entries: buffers.map((buffer, i) => ({
        binding: i,
        resource: { buffer },
      })),
    })
  );

  return { layout, bindGroups };
}

export function createPipeline(
  device: GPUDevice,
  layouts: GPUBindGroupLayout[],
  shaderLabel: string,
  shaderCode: string,
  entryPoint: string = "computeMain"
): GPUComputePipeline {
  const shaderModule = device.createShaderModule({
    code: shaderCode,
    label: `${shaderLabel}Module`,
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: layouts,
  });

  const pipeline = device.createComputePipeline({
    label: `${shaderLabel}Pipeline`,
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint,
    },
  });

  return pipeline;
}
