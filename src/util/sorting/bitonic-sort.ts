import { createBindGroupFromBuffers, createPipeline } from "../factories";

export const createBitonicSorter = (device: GPUDevice) => {
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

  const { bindGroup: sortStridesBindGroup, layout: sortStridesLayout } =
    createBindGroupFromBuffers(
      device,
      [counterpartStrideBuffer, directionStrideBuffer],
      ["uniform", "uniform"],
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
  const sortPipeline = createPipeline(
    device,
    [sortStridesLayout, sortBuffersLayout],
    "Sort",
    sortShader
  );
};
