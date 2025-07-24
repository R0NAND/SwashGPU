import { createAssignCellBindGroupLayout } from "../bind-group-layouts/assign-cell-layout";
import assignCellShader from "../compute-shaders/assign-cell.wgsl";

export const createAssignCellPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createAssignCellBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Assign Cell Shader",
        code: assignCellShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
