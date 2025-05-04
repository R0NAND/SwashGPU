import { createMainBindGroupLayout } from "../bind-group-layouts/main-layout";
import pressureShader from "../compute-shaders/compute-pressure.wgsl";

export const createPressurePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createMainBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Particle Shader",
        code: pressureShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
