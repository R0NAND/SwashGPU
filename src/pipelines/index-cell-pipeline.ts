import { createIndexCellBindGroupLayout } from "../bind-group-layouts/index-cell-layout";
import IndexCellShader from "../compute-shaders/index-cell.wgsl";

export const createIndexCellPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createIndexCellBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Index Cell Shader",
        code: IndexCellShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
