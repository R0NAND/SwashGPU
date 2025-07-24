import { createSortStridesBindGroupLayout } from "../bind-group-layouts/sort-strides-layout";
import { createSortBindGroupLayout } from "../bind-group-layouts/sort-layout";
import sortShader from "../compute-shaders/sort.wgsl";

export const createSortPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSortStridesBindGroupLayout(device),
        createSortBindGroupLayout(device),
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
