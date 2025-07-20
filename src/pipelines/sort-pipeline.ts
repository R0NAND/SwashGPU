import { createSortStridesBindGroupLayout } from "../bind-group-layouts/sort-strides-layout";
import { createSortBuffersBindGroupLayout } from "../bind-group-layouts/sort-buffers-layout";
import sortShader from "../compute-shaders/sort.wgsl";

export const createSortPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSortStridesBindGroupLayout(device),
        createSortBuffersBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Sort Shader",
        code: sortShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
